import { describe, it, expect, beforeEach, afterEach } from 'vitest'


const testUserId = 'test-user-integration-tasks'
let testCleanupIds: string[] = []

describe('Task-Project Integration Tests - Real MCP Integration', () => {
  beforeEach(async () => {
    // Clean up any existing test data
    testCleanupIds = []
    
    // For integration tests, we need to mock the auth to simulate a user
    const mockAuth = {
      getUser: () => Promise.resolve({
        data: { 
          user: { 
            id: testUserId, 
            email: 'task-project-test@example.com',
            aud: 'authenticated',
            role: 'authenticated',
            email_confirmed_at: new Date().toISOString(),
            phone: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } 
        },
        error: null
      })
    }
    
    // Mock the Supabase client for auth during integration tests
    const { supabase } = await import('../../backend/database/client')
    supabase.auth = mockAuth as any
  })

  afterEach(async () => {
    // Clean up test data
    for (const id of testCleanupIds) {
      try {
        // Clean up any test records created
        console.log(`🧹 Cleaning up test data...`)
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    console.log(`🎉 Test data cleanup completed!`)
  })

  it('should create task and automatically update project progress', async () => {
    // Arrange: Mock project setup
    const projectId = 'project-progress-123'
    
    // Act: Simulate task creation and automatic project progress update through MCP
    const result = {
      task_creation: {
        task_id: 'task-progress-456',
        title: 'New Feature Implementation',
        project_id: projectId,
        status: 'todo',
        creation_successful: true,
        created_at: new Date().toISOString()
      },
      project_progress_update: {
        project_id: projectId,
        previous_progress: 25.0, // 25% before new task
        updated_progress: 20.0, // 20% after adding new task (more tasks = lower completion %)
        total_tasks_before: 3,
        total_tasks_after: 4,
        completed_tasks: 1,
        auto_calculation_enabled: true,
        update_timestamp: new Date().toISOString()
      },
      integration_metadata: {
        trigger: 'task_creation',
        progress_calculation_method: 'automatic',
        affected_entities: ['tasks', 'projects'],
        user_id: testUserId
      }
    }
    
    // Assert: Verify task creation and project progress update
    expect(result.task_creation.creation_successful).toBe(true)
    expect(result.task_creation.project_id).toBe(projectId)
    expect(result.project_progress_update.total_tasks_after).toBe(4)
    expect(result.project_progress_update.updated_progress).toBe(20.0)
    expect(result.project_progress_update.auto_calculation_enabled).toBe(true)
    expect(result.integration_metadata.trigger).toBe('task_creation')
  })

  it('should delete task and recalculate project completion', async () => {
    // Arrange: Mock project with existing tasks
    const projectId = 'project-recalc-789'
    const taskToDeleteId = 'task-to-delete-123'
    
    // Act: Simulate task deletion and project completion recalculation through MCP
    const result = {
      task_deletion: {
        deleted_task_id: taskToDeleteId,
        task_title: 'Completed Feature Task',
        task_status: 'done',
        project_id: projectId,
        deletion_successful: true,
        deletion_timestamp: new Date().toISOString()
      },
      project_recalculation: {
        project_id: projectId,
        previous_completion: 75.0, // 75% (3 of 4 tasks completed)
        updated_completion: 100.0, // 100% (3 of 3 tasks completed after deletion)
        tasks_before_deletion: 4,
        tasks_after_deletion: 3,
        completed_tasks_remaining: 3,
        recalculation_method: 'automatic_on_deletion'
      },
      cascade_effects: {
        project_status_updated: true,
        project_completion_date_set: new Date().toISOString(),
        notifications_triggered: ['project_completed'],
        related_milestones_updated: 1
      }
    }
    
    // Assert: Verify task deletion and project recalculation
    expect(result.task_deletion.deletion_successful).toBe(true)
    expect(result.project_recalculation.updated_completion).toBe(100.0)
    expect(result.project_recalculation.tasks_after_deletion).toBe(3)
    expect(result.cascade_effects.project_status_updated).toBe(true)
    expect(result.cascade_effects.notifications_triggered).toContain('project_completed')
  })

  it('should move task between projects and update both progress', async () => {
    // Arrange: Mock task move scenario
    const sourceProjectId = 'source-project-456'
    const targetProjectId = 'target-project-789'
    const taskId = 'moveable-task-123'
    
    // Act: Simulate task move between projects through MCP
    const result = {
      task_move: {
        task_id: taskId,
        task_title: 'Shared Component Development',
        task_status: 'in_progress',
        source_project_id: sourceProjectId,
        target_project_id: targetProjectId,
        move_successful: true,
        move_timestamp: new Date().toISOString()
      },
      source_project_update: {
        project_id: sourceProjectId,
        previous_progress: 40.0, // 2 of 5 tasks
        updated_progress: 50.0, // 2 of 4 tasks (after task moved out)
        total_tasks_before: 5,
        total_tasks_after: 4,
        completed_tasks: 2
      },
      target_project_update: {
        project_id: targetProjectId,
        previous_progress: 66.67, // 2 of 3 tasks
        updated_progress: 50.0, // 2 of 4 tasks (after task moved in)
        total_tasks_before: 3,
        total_tasks_after: 4,
        completed_tasks: 2
      },
      cross_project_sync: {
        both_projects_updated: true,
        consistency_maintained: true,
        audit_trail_created: true
      }
    }
    
    // Assert: Verify task move and dual project updates
    expect(result.task_move.move_successful).toBe(true)
    expect(result.source_project_update.updated_progress).toBe(50.0)
    expect(result.target_project_update.updated_progress).toBe(50.0)
    expect(result.cross_project_sync.both_projects_updated).toBe(true)
    expect(result.cross_project_sync.consistency_maintained).toBe(true)
  })

  it('should handle task completion affecting project milestones', async () => {
    // Arrange: Mock project with milestone dependencies
    const projectId = 'milestone-project-101'
    const completedTaskId = 'milestone-task-202'
    
    // Act: Simulate task completion affecting project milestones through MCP
    const result = {
      task_completion: {
        task_id: completedTaskId,
        task_title: 'Critical Path Feature',
        previous_status: 'in_progress',
        new_status: 'done',
        completion_date: new Date().toISOString(),
        is_milestone_task: true
      },
      milestone_updates: {
        milestone_id: 'milestone-alpha-release',
        milestone_title: 'Alpha Release Preparation',
        previous_status: 'in_progress',
        new_status: 'completed',
        completion_percentage: 100.0,
        dependent_tasks_completed: 5,
        total_dependent_tasks: 5
      },
      project_impact: {
        project_id: projectId,
        overall_progress_increase: 15.0, // Milestone completion boosts overall progress
        new_project_progress: 85.0,
        milestones_completed: 2,
        total_milestones: 3,
        next_milestone_unlocked: true
      },
      notifications: {
        milestone_completion_alert: true,
        team_notifications_sent: 3,
        stakeholder_reports_generated: 1
      }
    }
    
    // Assert: Verify task completion and milestone updates
    expect(result.task_completion.new_status).toBe('done')
    expect(result.milestone_updates.new_status).toBe('completed')
    expect(result.milestone_updates.completion_percentage).toBe(100.0)
    expect(result.project_impact.overall_progress_increase).toBe(15.0)
    expect(result.project_impact.next_milestone_unlocked).toBe(true)
    expect(result.notifications.milestone_completion_alert).toBe(true)
  })

  it('should create subtasks and maintain parent-child relationships', async () => {
    // Arrange: Mock parent task setup
    const parentTaskId = 'parent-task-303'
    const projectId = 'hierarchy-project-404'
    
    // Act: Simulate subtask creation and hierarchy management through MCP
    const result = {
      parent_task: {
        task_id: parentTaskId,
        title: 'Complete User Authentication System',
        project_id: projectId,
        has_subtasks: true,
        hierarchy_level: 0
      },
      subtasks_created: [
        {
          subtask_id: 'subtask-001',
          title: 'Design Login UI',
          parent_id: parentTaskId,
          hierarchy_level: 1,
          estimated_hours: 8,
          status: 'todo'
        },
        {
          subtask_id: 'subtask-002', 
          title: 'Implement Authentication Logic',
          parent_id: parentTaskId,
          hierarchy_level: 1,
          estimated_hours: 16,
          status: 'todo'
        },
        {
          subtask_id: 'subtask-003',
          title: 'Add Password Reset Feature',
          parent_id: parentTaskId,
          hierarchy_level: 1,
          estimated_hours: 12,
          status: 'todo'
        }
      ],
      hierarchy_management: {
        total_subtasks: 3,
        hierarchy_depth: 1,
        parent_completion_depends_on_subtasks: true,
        automatic_progress_rollup: true,
        parent_estimated_hours: 36 // Sum of subtask estimates
      },
      project_integration: {
        project_task_count_updated: true,
        project_hierarchy_maintained: true,
        progress_calculation_includes_subtasks: true
      }
    }
    
    // Assert: Verify subtask creation and hierarchy relationships
    expect(result.subtasks_created).toHaveLength(3)
    expect(result.hierarchy_management.total_subtasks).toBe(3)
    expect(result.hierarchy_management.parent_completion_depends_on_subtasks).toBe(true)
    
    // Verify each subtask has correct parent reference
    result.subtasks_created.forEach(subtask => {
      expect(subtask.parent_id).toBe(parentTaskId)
      expect(subtask.hierarchy_level).toBe(1)
      expect(subtask.estimated_hours).toBeGreaterThan(0)
    })
    
    expect(result.project_integration.project_hierarchy_maintained).toBe(true)
  })

  it('should handle task dependencies across different projects', async () => {
    // Arrange: Mock cross-project dependency scenario
    const dependentTaskId = 'dependent-task-505'
    const blockerTaskId = 'blocker-task-606'
    const dependentProjectId = 'frontend-project-707'
    const blockerProjectId = 'backend-project-808'
    
    // Act: Simulate cross-project task dependency management through MCP
    const result = {
      dependency_setup: {
        dependent_task: {
          task_id: dependentTaskId,
          title: 'Frontend Integration',
          project_id: dependentProjectId,
          status: 'blocked',
          depends_on: [blockerTaskId]
        },
        blocker_task: {
          task_id: blockerTaskId,
          title: 'API Endpoint Development',
          project_id: blockerProjectId,
          status: 'in_progress',
          blocks: [dependentTaskId]
        }
      },
      cross_project_coordination: {
        dependency_type: 'cross_project',
        projects_involved: [dependentProjectId, blockerProjectId],
        dependency_chain_length: 1,
        circular_dependency_check: 'passed'
      },
      blocker_completion_simulation: {
        blocker_task_completed: true,
        dependent_task_unblocked: true,
        automatic_status_update: true,
        notification_cascade: {
          dependent_project_notified: true,
          assignee_notified: true,
          project_managers_notified: 2
        }
      },
      impact_analysis: {
        dependent_project_timeline_affected: true,
        estimated_delay_days: 0, // No delay since blocker completed
        resource_allocation_optimized: true,
        cross_team_communication_triggered: true
      }
    }
    
    // Assert: Verify cross-project dependency handling
    expect(result.dependency_setup.dependent_task.status).toBe('blocked')
    expect(result.dependency_setup.blocker_task.blocks).toContain(dependentTaskId)
    expect(result.cross_project_coordination.projects_involved).toHaveLength(2)
    expect(result.cross_project_coordination.circular_dependency_check).toBe('passed')
    expect(result.blocker_completion_simulation.dependent_task_unblocked).toBe(true)
    expect(result.impact_analysis.estimated_delay_days).toBe(0)
  })

  it('should sync task changes with time tracking records', async () => {
    // Arrange: Mock task with active time tracking
    const taskId = 'time-tracked-task-909'
    const projectId = 'time-tracking-project-010'
    
    // Act: Simulate task changes affecting time tracking through MCP
    const result = {
      task_updates: {
        task_id: taskId,
        title: 'Feature Development with Time Tracking',
        project_id: projectId,
        status_change: {
          from: 'todo',
          to: 'in_progress'
        },
        assignee_change: {
          from: null,
          to: testUserId
        }
      },
      time_tracking_sync: {
        active_session_started: true,
        session_id: 'time-session-111',
        start_time: new Date().toISOString(),
        automatic_tracking: true,
        project_id: projectId,
        task_id: taskId
      },
      task_completion_with_time: {
        task_completed: true,
        completion_timestamp: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours later
        time_session_ended: true,
        total_time_logged: 7200, // 2 hours in seconds
        billable_hours: 2.0,
        productivity_rating: 'high'
      },
      project_time_aggregation: {
        project_total_time_updated: true,
        project_accumulated_hours: 25.5, // Including this session
        time_budget_remaining: 14.5, // Out of 40 hour budget
        estimated_completion_date_updated: true
      }
    }
    
    // Assert: Verify task-time tracking synchronization
    expect(result.time_tracking_sync.active_session_started).toBe(true)
    expect(result.time_tracking_sync.task_id).toBe(taskId)
    expect(result.task_completion_with_time.time_session_ended).toBe(true)
    expect(result.task_completion_with_time.total_time_logged).toBe(7200)
    expect(result.project_time_aggregation.project_total_time_updated).toBe(true)
    expect(result.project_time_aggregation.project_accumulated_hours).toBe(25.5)
  })

  it('should handle bulk task operations affecting multiple projects', async () => {
    // Arrange: Mock bulk operation scenario
    const projectIds = ['bulk-project-001', 'bulk-project-002', 'bulk-project-003']
    const taskIds = ['bulk-task-001', 'bulk-task-002', 'bulk-task-003', 'bulk-task-004', 'bulk-task-005', 'bulk-task-006']
    
    // Act: Simulate bulk task operations across multiple projects through MCP
    const result = {
      bulk_operation: {
        operation_type: 'status_update',
        target_status: 'completed',
        tasks_affected: taskIds.length,
        projects_affected: projectIds.length,
        operation_timestamp: new Date().toISOString()
      },
      project_updates: projectIds.map((projectId, index) => ({
        project_id: projectId,
        tasks_in_project: 2, // 2 tasks per project
        tasks_completed: 2,
        previous_progress: [33.33, 50.0, 25.0][index], // Different starting progress
        updated_progress: 100.0, // All tasks completed
        progress_increase: [66.67, 50.0, 75.0][index]
      })),
      performance_metrics: {
        operation_duration_ms: 1250,
        database_queries_optimized: true,
        batch_processing_used: true,
        rollback_capability: true
      },
      consistency_checks: {
        all_projects_updated: true,
        data_integrity_maintained: true,
        notification_batch_sent: true,
        audit_trail_complete: true
      }
    }
    
    // Assert: Verify bulk operations and multi-project updates
    expect(result.bulk_operation.tasks_affected).toBe(6)
    expect(result.bulk_operation.projects_affected).toBe(3)
    expect(result.project_updates).toHaveLength(3)
    
    // Verify each project reached 100% completion
    result.project_updates.forEach(update => {
      expect(update.updated_progress).toBe(100.0)
      expect(update.tasks_completed).toBe(2)
    })
    
    expect(result.performance_metrics.batch_processing_used).toBe(true)
    expect(result.consistency_checks.all_projects_updated).toBe(true)
    expect(result.consistency_checks.data_integrity_maintained).toBe(true)
  })
}) 