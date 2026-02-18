import McpServerWrapper from './McpServerWrapper.js';
import { z } from 'zod';

// run "npm run inspector" to start the MCP Inspector

const sightings = [];

const server = new McpServerWrapper({
    name: 'Animal Sightings',
    version: '1.0.0',
}, (server) => {
    server.registerTool(
        'create_sighting',
        {
            description: 'creates a new sighting record with the specified animal name, and location',
            inputSchema: {
                animal: z.string().describe('The name of the animal that was sighted'),
                location: z.string().describe('The location where the animal was sighted')
            }
        },
        async ({ animal, location }) => {
            sightings.push({
                animal: animal.trim().toLowerCase(),
                location: location.trim().toLowerCase(),
                timestamp: Date.now()
            });
            return {
                content: [
                    {
                        type: 'text',
                        text: `Sighting created for ${animal} at location: ${location}`
                    }
                ]
            };
        }
    );
    server.registerTool(
        'get_sightings_for_animal',
        {
            description: 'retrieves all sightings for a given animal',
            inputSchema: {
                animal: z.string().describe('The name of the animal to retrieve sightings for')
            }
        },
        async ({ animal }) => {
            animal = animal.trim().toLowerCase();
            const animalSightings = sightings.filter(sighting => sighting.animal === animal);
            if (animalSightings.length === 0) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `No sightings found for ${animal}.`
                        }
                    ]
                };
            }
            return {
                structuredContent: { result: animalSightings.map(s => ({ ...s, timestamp: new Date(s.timestamp).toISOString() })) },
                content: [
                    {
                        type: 'text',
                        text: `Retrieved sightings for ${animal}: ${animalSightings.length} sightings found.`
                    }
                ]
            };
        }
    );
    server.registerTool(
        'get_sightings_for_location',
        {
            description: 'retrieves all sightings for a given location',
            inputSchema: {
                location: z.string().describe('The location to retrieve sightings for')
            }
        },
        async ({ location }) => {
            location = location.trim().toLowerCase();
            const locationSightings = sightings.filter(sighting => sighting.location === location);
            if (locationSightings.length === 0) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `No sightings found for location: ${location}.`
                        }
                    ]
                };
            }
            return {
                structuredContent: { result: locationSightings.map(s => ({ ...s, timestamp: new Date(s.timestamp).toISOString() })) },
                content: [
                    {
                        type: 'text',
                        text: `Retrieved sightings for location: ${location} (${locationSightings.length} sightings found)`
                    }
                ]
            };
        }
    );
    server.registerTool(
        'get_sightings_between_dates',
        {
            description: 'retrieves all sightings between two dates',
            inputSchema: {
                startDate: z.string().describe('The start date in ISO format'),
                endDate: z.string().describe('The end date in ISO format')
            }
        },
        async ({ startDate, endDate }) => {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const filteredSightings = sightings.filter(sighting => {
                const sightingDate = new Date(sighting.timestamp);
                return sightingDate >= start && sightingDate <= end;
            });
            if (filteredSightings.length === 0) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `No sightings found between ${startDate} and ${endDate}.`
                        }
                    ]
                };
            }
            return {
                structuredContent: { result: filteredSightings.map(s => ({ ...s, timestamp: new Date(s.timestamp).toISOString() })) },
                content: [
                    {
                        type: 'text',
                        text: `Retrieved sightings between ${startDate} and ${endDate} (${filteredSightings.length} sightings found)`
                    }
                ]
            };
        }
    );
});

server.listen();