import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TaskAPI } from '../services/api';
import { Ionicons } from 'react-native-vector-icons';
import { useAuth } from '../hooks/useAuth';

// Task type definition
interface Task {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  completedAt: string | null;
  priority: 'low' | 'medium' | 'high';
  category: string;
  estimatedTime: number;
  userId: number;
  assignedToUserId: number | null;
  isPublic: boolean;
}

// Component to show task priority as a colored badge
const PriorityBadge = ({ priority }: { priority: string }) => {
  let backgroundColor;
  switch (priority) {
    case 'high':
      backgroundColor = '#ef4444';
      break;
    case 'medium':
      backgroundColor = '#f59e0b';
      break;
    case 'low':
      backgroundColor = '#10b981';
      break;
    default:
      backgroundColor = '#6b7280';
  }

  return (
    <View style={[styles.priorityBadge, { backgroundColor }]}>
      <Text style={styles.priorityText}>{priority}</Text>
    </View>
  );
};

// Task item component
const TaskItem = ({ task, onPress, onToggleComplete }: { 
  task: Task; 
  onPress: () => void;
  onToggleComplete: () => void;
}) => {
  const dueDate = new Date(task.dueDate);
  const formattedDate = dueDate.toLocaleDateString();
  
  return (
    <TouchableOpacity style={styles.taskItem} onPress={onPress}>
      <View style={styles.taskHeader}>
        <TouchableOpacity 
          style={styles.checkbox} 
          onPress={onToggleComplete}
        >
          {task.completed ? (
            <Ionicons name="checkmark-circle" size={24} color="#6366f1" />
          ) : (
            <Ionicons name="ellipse-outline" size={24} color="#6366f1" />
          )}
        </TouchableOpacity>
        <View style={styles.taskInfo}>
          <Text 
            style={[
              styles.taskTitle, 
              task.completed && styles.completedTaskText
            ]}
          >
            {task.title}
          </Text>
          <Text style={styles.taskDate}>Due: {formattedDate}</Text>
        </View>
      </View>
      
      <View style={styles.taskFooter}>
        <PriorityBadge priority={task.priority} />
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{task.category}</Text>
        </View>
        {task.estimatedTime > 0 && (
          <View style={styles.timeBadge}>
            <Ionicons name="time-outline" size={14} color="#4b5563" />
            <Text style={styles.timeText}>{task.estimatedTime} min</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Filter options for tasks
type FilterType = 'all' | 'today' | 'upcoming' | 'completed';

const HomeScreen = ({ navigation }: any) => {
  const [filter, setFilter] = useState<FilterType>('today');
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch tasks
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await TaskAPI.getTasks();
      return response.data;
    }
  });

  // Complete task mutation
  const { mutate: completeTask } = useMutation({
    mutationFn: (taskId: number) => TaskAPI.completeTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Filter tasks based on selected filter
  const getFilteredTasks = () => {
    if (!data) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (filter) {
      case 'today':
        return data.filter((task: Task) => {
          const taskDate = new Date(task.dueDate);
          taskDate.setHours(0, 0, 0, 0);
          return taskDate.getTime() === today.getTime() && !task.completed;
        });
      case 'upcoming':
        return data.filter((task: Task) => {
          const taskDate = new Date(task.dueDate);
          taskDate.setHours(0, 0, 0, 0);
          return taskDate.getTime() > today.getTime() && !task.completed;
        });
      case 'completed':
        return data.filter((task: Task) => task.completed);
      case 'all':
      default:
        return data;
    }
  };

  const handleToggleComplete = (task: Task) => {
    completeTask(task.id);
  };

  const navigateToTaskDetail = (task: Task) => {
    navigation.navigate('TaskDetail', { taskId: task.id });
  };

  const navigateToNewTask = () => {
    navigation.navigate('NewTask');
  };

  const renderFilterButton = (filterType: FilterType, label: string) => (
    <TouchableOpacity
      style={[styles.filterButton, filter === filterType && styles.activeFilterButton]}
      onPress={() => setFilter(filterType)}
    >
      <Text
        style={[
          styles.filterButtonText,
          filter === filterType && styles.activeFilterButtonText,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>Error loading tasks</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const filteredTasks = getFilteredTasks();

  return (
    <View style={styles.container}>
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {renderFilterButton('today', "Today's")}
        {renderFilterButton('upcoming', 'Upcoming')}
        {renderFilterButton('completed', 'Completed')}
        {renderFilterButton('all', 'All')}
      </View>

      {/* Task List */}
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TaskItem 
            task={item} 
            onPress={() => navigateToTaskDetail(item)} 
            onToggleComplete={() => handleToggleComplete(item)}
          />
        )}
        contentContainerStyle={styles.taskList}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-done-circle-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyText}>
              {filter === 'completed'
                ? 'No completed tasks yet'
                : filter === 'today'
                ? 'No tasks for today'
                : filter === 'upcoming'
                ? 'No upcoming tasks'
                : 'No tasks found'}
            </Text>
          </View>
        }
      />

      {/* Add Task Button */}
      <TouchableOpacity style={styles.addButton} onPress={navigateToNewTask}>
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  activeFilterButton: {
    backgroundColor: '#6366f1',
  },
  filterButtonText: {
    color: '#6b7280',
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: '#fff',
  },
  taskList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  taskItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    marginRight: 12,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  completedTaskText: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  taskDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  taskFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  priorityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  categoryBadge: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  categoryText: {
    color: '#4b5563',
    fontSize: 12,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    color: '#4b5563',
    fontSize: 12,
    marginLeft: 4,
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#6366f1',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default HomeScreen;