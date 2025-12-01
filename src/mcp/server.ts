import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { TaskManager } from '../core/task-manager.js';
import type { Task, TaskStatus } from '../types/index.js';
import { PULSE_VERSION } from '../version.js';
import { getProjectPath } from '../utils/project-path.js';
import { formatTagList } from '../utils/tag-list.js';

// Helper function to serialize task for MCP response
function serializeTask(task: Task, taskManager: TaskManager): Record<string, unknown> {
  const tagDetails = taskManager.getTagDetails(task.tag);
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    tag: task.tag,
    tagDescription: tagDetails?.description,
    order: task.order,
    subtasks: task.subtasks.map(st => ({
      id: st.id,
      title: st.title,
      status: st.status,
      order: st.order,
      createdAt: st.createdAt.toISOString(),
      updatedAt: st.updatedAt.toISOString()
    })),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString()
  };
}

// Define available tools
const TOOLS: Tool[] = [
  {
    name: 'pulse_add_task',
    description: 'Create a new task or subtask',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Task title (required)',
        },
        description: {
          type: 'string',
          description: 'Task description (optional)',
        },
        tag: {
          type: 'string',
          description: 'Task tag (defaults to "base")',
        },
        parent_task_id: {
          type: 'number',
          description: 'If provided, creates a subtask under this parent task ID',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'pulse_update_task',
    description: 'Update a task or subtask (title/status; description is task-only)',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: {
          type: 'number',
          description: 'Task ID (required)',
        },
        subtask_id: {
          type: 'number',
          description: 'If provided, updates the subtask with this ID',
        },
        title: {
          type: 'string',
          description: 'New title',
        },
        description: {
          type: 'string',
          description: 'New task description (subtasks do not support descriptions)',
        },
        status: {
          type: 'string',
          enum: ['PENDING', 'INPROGRESS', 'DONE'],
          description: 'New status',
        },
        tag: {
          type: 'string',
          description: 'Task tag (optional, helps with lookup)',
        },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'pulse_get_tasks',
    description: 'List tasks, get details, or find the next task',
    inputSchema: {
      type: 'object',
      properties: {
        tag: {
          type: 'string',
          description: 'Filter by tag',
        },
        status: {
          type: 'string',
          enum: ['PENDING', 'INPROGRESS', 'DONE'],
          description: 'Filter by status',
        },
        task_id: {
          type: 'number',
          description: 'If provided, returns details for this specific task',
        },
        mode: {
          type: 'string',
          enum: ['list', 'next'],
          description: 'Operation mode: "list" (default) or "next" (find next task)',
        },
      },
    },
  },
  {
    name: 'pulse_manage_tags',
    description: 'Manage tags (list, update, delete)',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'update', 'delete'],
          description: 'Action to perform',
        },
        tag: {
          type: 'string',
          description: 'Tag name (required for update/delete)',
        },
        description: {
          type: 'string',
          description: 'New description (for update action)',
        },
        show_all: {
          type: 'boolean',
          description: 'Show all tags including empty ones (for list action)',
        },
      },
      required: ['action'],
    },
  },
  {
    name: 'pulse_get_info',
    description: 'Get system information (directory, version)',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

/**
 * Start the MCP server with an optional working directory override
 * @param workingDir - Optional working directory path. If not provided, auto-detects from process.cwd()
 */
export async function startMcpServer(workingDir?: string): Promise<void> {
  const server = new Server(
    {
      name: 'pulse-mcp',
      version: PULSE_VERSION,
    },
    {
      capabilities: {
        tools: {},
      },
      instructions: `Use tags as epics for big features (e.g., "add-stripe").
Create tasks and subtasks within tags to complete the epic.
Use tag descriptions to store context, such as paths to PRD documents or project overviews. This helps you understand the goal when working on tasks in that tag.
When asked to "continue work for [feature]", find the related tag and use pulse_get_tasks with mode="next".

TASKS AND SUBTASKS:
- Tasks are the main work items within a tag/epic.
- Subtasks break down complex tasks into more specific, actionable work items.
- Use subtasks when a task is large or complex and needs to be broken into smaller steps.
- Both tasks and subtasks follow the same workflow: PENDING → INPROGRESS → DONE.
- Subtasks help track progress within a task and make it easier to work incrementally.

WORKFLOW STATES:
Tasks and subtasks follow PENDING → INPROGRESS → DONE and typically should be completed in order.
Using these states (PENDING, INPROGRESS, DONE) is mandatory for both tasks and subtasks.

STRICT WORKFLOW:
1. Pick a task or subtask (pulse_get_tasks mode="next" or mode="list").
2. Move it to INPROGRESS (pulse_update_task status="INPROGRESS").
3. Work on it.
4. Move it to DONE (pulse_update_task status="DONE") when finished.
Do not skip steps. Always keep task and subtask status in sync with your actual work.`,
    }
  );

  // Resolve project root: use workingDir if provided, otherwise auto-detect from process.cwd()
  const projectRoot = getProjectPath(workingDir, process.cwd());
  const taskManager = new TaskManager(projectRoot);

  // Handle list tools request
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: TOOLS,
    };
  });

  // Handle tool execution
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'pulse_add_task': {
          const { title, description, tag, parent_task_id } = args as {
            title: string;
            description?: string;
            tag?: string;
            parent_task_id?: number;
          };

          if (parent_task_id !== undefined) {
            // Add subtask
            const subtask = taskManager.addSubtask(parent_task_id, title, tag);
            if (!subtask) {
              return {
                content: [{ type: 'text', text: `Parent task with ID ${parent_task_id} not found` }],
                isError: true,
              };
            }
            return {
              content: [{
                type: 'text',
                text: `Subtask added successfully:\n${JSON.stringify({
                  id: subtask.id,
                  title: subtask.title,
                  status: subtask.status,
                  order: subtask.order,
                  createdAt: subtask.createdAt.toISOString(),
                  updatedAt: subtask.updatedAt.toISOString()
                }, null, 2)}`
              }],
            };
          } else {
            // Add task
            const task = taskManager.createTask(title, description, tag);
            return {
              content: [{
                type: 'text',
                text: `Task created successfully:\n${JSON.stringify(serializeTask(task, taskManager), null, 2)}`
              }],
            };
          }
        }

        case 'pulse_update_task': {
          const { task_id, subtask_id, title, description, status, tag } = args as {
            task_id: number;
            subtask_id?: number;
            title?: string;
            description?: string;
            status?: TaskStatus;
            tag?: string;
          };

          if (subtask_id !== undefined) {
            // Update subtask (single save even when multiple fields provided)
            const updates: { title?: string; status?: TaskStatus } = {};
            if (status) updates.status = status;
            if (title) updates.title = title;

            if (!updates.title && !updates.status) {
              return { content: [{ type: 'text', text: 'No supported subtask updates provided (status/title only)' }], isError: true };
            }

            const subtask = taskManager.updateSubtask(task_id, subtask_id, updates, tag);
            if (!subtask) return { content: [{ type: 'text', text: `Subtask ${subtask_id} not found` }], isError: true };

            // Note: Description update for subtasks is not supported by TaskManager yet.
            return {
              content: [{ type: 'text', text: `Subtask ${subtask_id} updated successfully` }],
            };
          } else {
            // Update task
            // Note: status and other fields are applied in separate calls, so partial updates are possible if the second write fails.
            if (status) {
              const task = taskManager.updateTaskStatus(task_id, status, tag);
              if (!task) return { content: [{ type: 'text', text: `Task ${task_id} not found` }], isError: true };
            }
            if (title || description || tag) {
              const task = taskManager.updateTask(task_id, { title, description, tag });
              if (!task) return { content: [{ type: 'text', text: `Task ${task_id} not found` }], isError: true };
            }
            
            // Fetch updated task to show result
            const updatedTask = taskManager.getTask(task_id, tag);
            if (!updatedTask) {
              return { content: [{ type: 'text', text: `Task ${task_id} not found after update` }], isError: true };
            }
            return {
              content: [{
                type: 'text',
                text: `Task updated successfully:\n${JSON.stringify(serializeTask(updatedTask, taskManager), null, 2)}`
              }],
            };
          }
        }

        case 'pulse_get_tasks': {
          const { tag, status, task_id, mode } = args as {
            tag?: string;
            status?: TaskStatus;
            task_id?: number;
            mode?: 'list' | 'next';
          };

          if (task_id !== undefined) {
            const task = taskManager.getTask(task_id, tag);
            if (!task) return { content: [{ type: 'text', text: `Task ${task_id} not found` }], isError: true };
            return {
              content: [{
                type: 'text',
                text: `Task details:\n${JSON.stringify(serializeTask(task, taskManager), null, 2)}`
              }],
            };
          }

          if (mode === 'next') {
            const task = taskManager.getNextTask(tag);
            if (!task) {
              return {
                content: [{
                  type: 'text',
                  text: tag ? `No pending or in-progress tasks found for tag "${tag}"` : 'No pending or in-progress tasks found'
                }],
              };
            }
            return {
              content: [{
                type: 'text',
                text: `Next task to work on:\n${JSON.stringify(serializeTask(task, taskManager), null, 2)}`
              }],
            };
          }

          // Default: List tasks
          const tasks = taskManager.listTasks(tag, status);
          return {
            content: [{
              type: 'text',
              text: `Found ${tasks.length} task(s):\n${JSON.stringify(tasks.map(t => serializeTask(t, taskManager)), null, 2)}`
            }],
          };
        }

        case 'pulse_manage_tags': {
          const { action, tag, description, show_all } = args as {
            action: 'list' | 'update' | 'delete';
            tag?: string;
            description?: string;
            show_all?: boolean;
          };

          if (action === 'list') {
            const result = formatTagList(taskManager, { showAll: Boolean(show_all) });
            return { content: [{ type: 'text', text: result }] };
          }

          if (action === 'update') {
            if (!tag || !description) return { content: [{ type: 'text', text: 'Tag and description required for update' }], isError: true };
            const success = taskManager.updateTag(tag, description);
            return success 
              ? { content: [{ type: 'text', text: `Tag "${tag}" updated successfully` }] }
              : { content: [{ type: 'text', text: `Tag "${tag}" not found` }], isError: true };
          }

          if (action === 'delete') {
            if (!tag) return { content: [{ type: 'text', text: 'Tag required for delete' }], isError: true };
            const success = taskManager.deleteTag(tag);
            return success
              ? { content: [{ type: 'text', text: `Tag "${tag}" deleted successfully` }] }
              : { content: [{ type: 'text', text: `Tag "${tag}" not found` }], isError: true };
          }
          
          return { content: [{ type: 'text', text: `Unknown action: ${action}` }], isError: true };
        }

        case 'pulse_get_info': {
          const pulseDir = taskManager.getPulseDir();
          return {
            content: [{ type: 'text', text: `Pulse Directory: ${pulseDir}\nVersion: ${PULSE_VERSION}` }],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
