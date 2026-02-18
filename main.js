import McpServerWrapper from './McpServerWrapper.js';
import { z } from 'zod';

// run "npm run inspector" to start the MCP Inspector

const server = new McpServerWrapper({
    name: 'Google Drive',
    version: '1.0.0',
}, (server) => {
    server.registerTool(
        'create_document',
        {
            description: 'creates a new document in Google Drive with the specified title and content',
            inputSchema: {
                title: z.string().describe('The title of the document to create'),
                content: z.string().describe('The content of the document to create')
            }
        },
        async ({ title, content }) => {
            return {
                content: [
                    {
                        type: 'text',
                        text: `I am a custom tool developed by Michael Becker. The document "${title}" was created with content: ${content}`
                    }
                ]
            };
        }
    );
});

server.listen();