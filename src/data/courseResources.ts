import type { Resource } from '@/types';

/**
 * Course-specific learning resources mapped by course code.
 * Resources include documentation, cheat sheets, interactive labs, and external learning paths.
 */
export const courseResources: Record<string, Resource[]> = {
  // Python Programming (55284A)
  '55284A': [
    {
      id: 'python-1',
      title: 'Microsoft Learn: Python for Beginners',
      description: 'Official Microsoft learning path covering Python fundamentals, data types, and control flow',
      type: 'link',
      url: 'https://learn.microsoft.com/en-us/training/modules/intro-to-python/',
      isNew: true,
    },
    {
      id: 'python-2',
      title: 'Python Official Documentation',
      description: 'Comprehensive Python 3 tutorial from the official documentation',
      type: 'link',
      url: 'https://docs.python.org/3/tutorial/',
    },
    {
      id: 'python-4',
      title: 'Replit - Python Online IDE',
      description: 'Interactive Python environment to practice coding directly in your browser',
      type: 'lab',
      url: 'https://replit.com/languages/python3',
      isNew: true,
    },
    {
      id: 'python-5',
      title: 'Python Quick Reference',
      description: 'Comprehensive quick reference covering all Python essentials',
      type: 'download',
      url: 'https://quickref.me/python.html',
    },
  ],

  // MongoDB (932)
  '932': [
    {
      id: 'mongo-1',
      title: 'MongoDB University Learning Path',
      description: 'Free courses from MongoDB including certification preparation',
      type: 'link',
      url: 'https://learn.mongodb.com/',
      isNew: true,
    },
    {
      id: 'mongo-2',
      title: 'MongoDB Official Documentation',
      description: 'Complete MongoDB manual with tutorials, references, and best practices',
      type: 'link',
      url: 'https://www.mongodb.com/docs/manual/',
    },
    {
      id: 'mongo-3',
      title: 'MongoDB Shell Cheat Sheet (PDF)',
      description: 'Quick reference for MongoDB Shell commands and operations',
      type: 'pdf',
      url: 'https://mongodb-devhub-cms.s3.us-west-1.amazonaws.com/Mongo_DB_Shell_Cheat_Sheet_1a0e3aa962.pdf',
      size: '1.8 MB',
    },
    {
      id: 'mongo-4',
      title: 'MongoDB Atlas Free Tier',
      description: 'Set up a free MongoDB cluster to practice database operations in the cloud',
      type: 'lab',
      url: 'https://www.mongodb.com/cloud/atlas/register',
      isNew: true,
    },
    {
      id: 'mongo-5',
      title: 'MongoDB Quick Reference',
      description: 'Comprehensive quick reference for MongoDB queries and aggregations',
      type: 'download',
      url: 'https://quickref.me/mongodb.html',
    },
  ],
};

/**
 * Get resources for a specific course code.
 * Returns an empty array if no resources are defined for the course.
 */
export function getCourseResources(courseCode: string): Resource[] {
  return courseResources[courseCode] || [];
}
