/**
 * Mock API service layer for fetching data from mock/sampleData.
 * All functions are async and return mock data.
 */
import {
  incubators,
  projects,
  mentors,
  managers,
  tools,
  requests,
  announcements,
  notifications,
  evaluations,
} from "../mock/sampleData";

export async function getIncubators() {
  return Promise.resolve(incubators);
}

export async function getProjects() {
  return Promise.resolve(projects);
}

export async function getMentors() {
  return Promise.resolve(mentors);
}

export async function getManagers() {
  return Promise.resolve(managers);
}

export async function getTools() {
  return Promise.resolve(tools);
}

export async function getRequests() {
  return Promise.resolve(requests);
}

export async function getAnnouncements() {
  return Promise.resolve(announcements);
}

export async function getNotifications() {
  return Promise.resolve(notifications);
}

export async function getEvaluations() {
  return Promise.resolve(evaluations);
}
