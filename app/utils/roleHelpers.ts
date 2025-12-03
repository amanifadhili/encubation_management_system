/**
 * Role helper utilities for checking user permissions
 */

import type { UserRole } from '../services/auth';

/**
 * Check if user has manager or director role
 * @param role - User role to check
 * @returns true if user is manager or director
 */
export function isManagerOrDirector(role?: UserRole): boolean {
  return role === 'manager' || role === 'director';
}

/**
 * Check if user has director role
 * @param role - User role to check
 * @returns true if user is director
 */
export function isDirector(role?: UserRole): boolean {
  return role === 'director';
}

/**
 * Check if user has manager role
 * @param role - User role to check
 * @returns true if user is manager
 */
export function isManager(role?: UserRole): boolean {
  return role === 'manager';
}

/**
 * Check if user can perform manager-level operations
 * (Includes both manager and director roles)
 * @param role - User role to check
 * @returns true if user can perform manager operations
 */
export function canPerformManagerOperations(role?: UserRole): boolean {
  return isManagerOrDirector(role);
}

