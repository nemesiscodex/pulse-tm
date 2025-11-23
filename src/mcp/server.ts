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

// Helper function to serialize task for MCP response
function serializeTask(task: Task): Record<string, unknown> {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    tag: task.tag,
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
    name: 'pulse_add',
    description: 'Create a new task',
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
      },
      required: ['title'],
    },
  },
  {
    name: 'pulse_list',
    description: 'List tasks with optional filtering',
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
      },
    },
  },
  {
    name: 'pulse_update',
    description: 'Update an existing task',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'number',
          description: 'Task ID (required)',
        },
        title: {
          type: 'string',
          description: 'New task title',
        },
        description: {
          type: 'string',
          description: 'New task description',
        },
        tag: {
          type: 'string',
          description: 'New task tag',
        },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'pulse_status',
    description: 'Change task status',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'number',
          description: 'Task ID (required)',
        },
        status: {
          type: 'string',
          enum: ['PENDING', 'INPROGRESS', 'DONE'],
          description: 'New status (required)',
        },
      },
      required: ['taskId', 'status'],
    },
  },
  {
    name: 'pulse_next',
    description: 'Get the next task to work on',
    inputSchema: {
      type: 'object',
      properties: {
        tag: {
          type: 'string',
          description: 'Limit search to specific tag',
        },
      },
    },
  },
  {
    name: 'pulse_subtask_add',
    description: 'Add a subtask to an existing task',
    inputSchema: {
      type: 'object',
      properties: {
        parentTaskId: {
          type: 'number',
          description: 'Parent task ID (required)',
        },
        title: {
          type: 'string',
          description: 'Subtask title (required)',
        },
      },
      required: ['parentTaskId', 'title'],
    },
  },
  {
    name: 'pulse_subtask_status',
    description: 'Change subtask status',
    inputSchema: {
      type: 'object',
      properties: {
        parentTaskId: {
          type: 'number',
          description: 'Parent task ID (required)',
        },
        subtaskId: {
          type: 'number',
          description: 'Subtask ID (required)',
        },
        status: {
          type: 'string',
          enum: ['PENDING', 'INPROGRESS', 'DONE'],
          description: 'New status (required)',
        },
      },
      required: ['parentTaskId', 'subtaskId', 'status'],
    },
  },
  {
    name: 'pulse_show',
    description: 'Show detailed task information',
    inputSchema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'number',
          description: 'Task ID (required)',
        },
        tag: {
          type: 'string',
          description: 'Task tag (optional, helps with lookup)',
        },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'pulse_tags',
    description: 'List all tags or tags with open tasks',
    inputSchema: {
      type: 'object',
      properties: {
        all: {
          type: 'boolean',
          description: 'Show all tags including empty ones (default: false)',
        },
      },
    },
  },
  {
    name: 'pulse_get_directory',
    description: 'Get the full path to the .pulse directory',
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
When asked to "continue work for [feature]", find the related tag and use pulse_next.
Tasks follow PENDING → INPROGRESS → DONE and typically should be completed in order.`,
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
      case 'pulse_add': {
        const { title, description, tag } = args as {
          title: string;
          description?: string;
          tag?: string;
        };
        
        const task = taskManager.createTask(title, description, tag);
        return {
          content: [
            {
              type: 'text',
              text: `Task created successfully:\n${JSON.stringify(serializeTask(task), null, 2)}`,
            },
          ],
        };
      }

      case 'pulse_list': {
        const { tag, status } = args as {
          tag?: string;
          status?: TaskStatus;
        };
        
        const tasks = taskManager.listTasks(tag, status);
        return {
          content: [
            {
              type: 'text',
              text: `Found ${tasks.length} task(s):\n${JSON.stringify(tasks.map(serializeTask), null, 2)}`,
            },
          ],
        };
      }

      case 'pulse_update': {
        const { taskId, title, description, tag } = args as {
          taskId: number;
          title?: string;
          description?: string;
          tag?: string;
        };
        
        const task = taskManager.updateTask(taskId, { title, description, tag });
        if (!task) {
          return {
            content: [
              {
                type: 'text',
                text: `Task with ID ${taskId} not found`,
              },
            ],
          };
        }
        
        return {
          content: [
            {
              type: 'text',
              text: `Task updated successfully:\n${JSON.stringify(serializeTask(task), null, 2)}`,
            },
          ],
        };
      }

      case 'pulse_status': {
        const { taskId, status } = args as {
          taskId: number;
          status: TaskStatus;
        };
        
        const task = taskManager.updateTaskStatus(taskId, status);
        if (!task) {
          return {
            content: [
              {
                type: 'text',
                text: `Task with ID ${taskId} not found`,
              },
            ],
          };
        }
        
        return {
          content: [
            {
              type: 'text',
              text: `Task status updated successfully:\n${JSON.stringify(serializeTask(task), null, 2)}`,
            },
          ],
        };
      }

      case 'pulse_next': {
        const { tag } = args as { tag?: string };
        
        const task = taskManager.getNextTask(tag);
        if (!task) {
          return {
            content: [
              {
                type: 'text',
                text: tag 
                  ? `No pending or in-progress tasks found for tag "${tag}"`
                  : 'No pending or in-progress tasks found',
              },
            ],
          };
        }
        
        return {
          content: [
            {
              type: 'text',
              text: `Next task to work on:\n${JSON.stringify(serializeTask(task), null, 2)}`,
            },
          ],
        };
      }

      case 'pulse_subtask_add': {
        const { parentTaskId, title } = args as {
          parentTaskId: number;
          title: string;
        };
        
        const subtask = taskManager.addSubtask(parentTaskId, title);
        if (!subtask) {
          return {
            content: [
              {
                type: 'text',
                text: `Task with ID ${parentTaskId} not found`,
              },
            ],
          };
        }
        
        return {
          content: [
            {
              type: 'text',
              text: `Subtask added successfully:\n${JSON.stringify({
                id: subtask.id,
                title: subtask.title,
                status: subtask.status,
                order: subtask.order,
                createdAt: subtask.createdAt.toISOString(),
                updatedAt: subtask.updatedAt.toISOString()
              }, null, 2)}`,
            },
          ],
        };
      }

      case 'pulse_subtask_status': {
        const { parentTaskId, subtaskId, status } = args as {
          parentTaskId: number;
          subtaskId: number;
          status: TaskStatus;
        };
        
        const subtask = taskManager.updateSubtaskStatus(parentTaskId, subtaskId, status);
        if (!subtask) {
          return {
            content: [
              {
                type: 'text',
                text: `Task ${parentTaskId} or subtask ${subtaskId} not found`,
              },
            ],
          };
        }
        
        return {
          content: [
            {
              type: 'text',
              text: `Subtask status updated successfully:\n${JSON.stringify({
                id: subtask.id,
                title: subtask.title,
                status: subtask.status,
                order: subtask.order,
                createdAt: subtask.createdAt.toISOString(),
                updatedAt: subtask.updatedAt.toISOString()
              }, null, 2)}`,
            },
          ],
        };
      }

      case 'pulse_show': {
        const { taskId, tag } = args as {
          taskId: number;
          tag?: string;
        };
        
        const task = taskManager.getTask(taskId, tag);
        if (!task) {
          return {
            content: [
              {
                type: 'text',
                text: `Task with ID ${taskId} not found`,
              },
            ],
          };
        }
        
        return {
          content: [
            {
              type: 'text',
              text: `Task details:\n${JSON.stringify(serializeTask(task), null, 2)}`,
            },
          ],
        };
      }

      case 'pulse_tags': {
        const { all } = args as { all?: boolean };
        
        const allTags = taskManager.getAllTags();
        const showAll = all || false;
        
        let result = '';
        
        if (showAll) {
          result = 'All tags:\n';
          for (const tag of allTags) {
            const tasks = taskManager.listTasks(tag);
            result += `  ${tag} (${tasks.length} tasks)\n`;
          }
        } else {
          result = 'Tags with open tasks:\n';
          let foundOpenTasks = false;
          
          for (const tag of allTags) {
            const openTasks = taskManager.listTasks(tag).filter(task => 
              task.status === 'PENDING' || task.status === 'INPROGRESS'
            );
            
            if (openTasks.length > 0) {
              result += `  ${tag} (${openTasks.length} open)\n`;
              foundOpenTasks = true;
            }
          }
          
          if (!foundOpenTasks) {
            result += '  No tags with open tasks found.\n';
          }
        }
        
        return {
          content: [
            {
              type: 'text',
              text: result.trim(),
            },
          ],
        };
      }

      case 'pulse_get_directory': {
        const pulseDir = taskManager.getPulseDir();
        return {
          content: [
            {
              type: 'text',
              text: pulseDir,
            },
          ],
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
    };
  }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Don't log to stderr as it might interfere with MCP communication
}