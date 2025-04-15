import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Ionicons } from 'react-native-vector-icons';
import { AiAPI, TaskAPI } from '../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import SmartTasks from '../components/SmartTasks';

// AI suggestion types
interface Task {
  title: string;
  estimatedTime: number;
}

interface SuggestionGroup {
  title: string;
  steps: Task[];
  recommendation: string;
}

// AI delegation response
interface DelegationResult {
  taskTitle: string;
  analysisAndContext: string;
  completionSteps: Array<{
    stepNumber: number;
    description: string;
    estimatedMinutes: number;
  }>;
  draftContent: string;
  resourceSuggestions: string[];
  totalEstimatedTime: number;
  nextActions: string;
}

const AiAssistantScreen = ({ navigation }: any) => {
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [context, setContext] = useState('');
  const [activeTab, setActiveTab] = useState<'suggestions' | 'delegation' | 'smart_tasks'>('smart_tasks');

  // Fetch AI suggestions
  const {
    data: suggestions,
    isLoading: isLoadingSuggestions,
    error: suggestionsError,
    refetch: refetchSuggestions,
  } = useQuery({
    queryKey: ['ai-suggestions'],
    queryFn: async () => {
      const response = await AiAPI.getTaskSuggestions();
      return response.data;
    },
  });

  // Fetch tasks for delegation
  const {
    data: tasks,
    isLoading: isLoadingTasks,
    error: tasksError,
  } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await TaskAPI.getTasks();
      return response.data;
    },
  });

  // Delegate task mutation
  const {
    mutate: delegateTask,
    data: delegationResult,
    isPending: isDelegating,
    error: delegationError,
    reset: resetDelegation,
  } = useMutation({
    mutationFn: async ({ taskId, context }: { taskId: number; context?: string }) => {
      const response = await AiAPI.delegateTask(taskId, context);
      return response.data;
    },
  });

  const handleDelegateTask = () => {
    if (selectedTaskId) {
      delegateTask({ taskId: selectedTaskId, context });
    }
  };

  const handleSelectTask = (taskId: number) => {
    setSelectedTaskId(taskId);
    resetDelegation();
  };

  // Render AI suggestions
  const renderSuggestions = () => {
    if (isLoadingSuggestions) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading AI suggestions...</Text>
        </View>
      );
    }

    if (suggestionsError) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={styles.errorText}>Error loading suggestions</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetchSuggestions()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView style={styles.suggestionsContainer}>
        {suggestions?.map((group: SuggestionGroup, index: number) => (
          <View key={index} style={styles.suggestionGroup}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <Text style={styles.groupDescription}>{group.recommendation}</Text>
            
            {group.steps.map((step: Task, stepIndex: number) => (
              <View key={stepIndex} style={styles.stepItem}>
                <View style={styles.stepIconContainer}>
                  <Ionicons name="chevron-forward" size={20} color="#6366f1" />
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  {step.estimatedTime > 0 && (
                    <Text style={styles.stepTime}>{step.estimatedTime} min</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    );
  };

  // Render task delegation
  const renderDelegation = () => {
    if (isLoadingTasks) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading tasks...</Text>
        </View>
      );
    }

    if (tasksError) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={styles.errorText}>Error loading tasks</Text>
          <TouchableOpacity style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (delegationResult) {
      return (
        <ScrollView style={styles.delegationResultContainer}>
          <View style={styles.delegationResultHeader}>
            <Text style={styles.delegationResultTitle}>
              {delegationResult.taskTitle}
            </Text>
            <Text style={styles.delegationResultEstimate}>
              Estimated time: {delegationResult.totalEstimatedTime} min
            </Text>
          </View>

          <View style={styles.delegationSection}>
            <Text style={styles.sectionTitle}>Analysis</Text>
            <Text style={styles.sectionContent}>
              {delegationResult.analysisAndContext}
            </Text>
          </View>

          <View style={styles.delegationSection}>
            <Text style={styles.sectionTitle}>Steps to Complete</Text>
            {delegationResult.completionSteps.map((step, index) => (
              <View key={index} style={styles.delegationStepItem}>
                <Text style={styles.delegationStepNumber}>{step.stepNumber}</Text>
                <View style={styles.delegationStepContent}>
                  <Text style={styles.delegationStepDescription}>
                    {step.description}
                  </Text>
                  <Text style={styles.delegationStepTime}>
                    {step.estimatedMinutes} min
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.delegationSection}>
            <Text style={styles.sectionTitle}>Content Draft</Text>
            <Text style={styles.sectionContent}>{delegationResult.draftContent}</Text>
          </View>

          <View style={styles.delegationSection}>
            <Text style={styles.sectionTitle}>Resources</Text>
            {delegationResult.resourceSuggestions.map((resource, index) => (
              <View key={index} style={styles.resourceItem}>
                <Ionicons name="link-outline" size={16} color="#6366f1" />
                <Text style={styles.resourceText}>{resource}</Text>
              </View>
            ))}
          </View>

          <View style={styles.delegationSection}>
            <Text style={styles.sectionTitle}>Next Actions</Text>
            <Text style={styles.sectionContent}>{delegationResult.nextActions}</Text>
          </View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              resetDelegation();
              setSelectedTaskId(null);
            }}
          >
            <Text style={styles.backButtonText}>Delegate Another Task</Text>
          </TouchableOpacity>
        </ScrollView>
      );
    }

    return (
      <View style={styles.delegationContainer}>
        <Text style={styles.delegationTitle}>
          Select a task to delegate to the AI assistant:
        </Text>

        <FlatList
          data={tasks || []}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.taskItem,
                selectedTaskId === item.id && styles.selectedTaskItem,
              ]}
              onPress={() => handleSelectTask(item.id)}
            >
              <Text style={styles.taskTitle}>{item.title}</Text>
              <Text style={styles.taskDescription} numberOfLines={2}>
                {item.description}
              </Text>
            </TouchableOpacity>
          )}
          style={styles.taskList}
        />

        <View style={styles.contextContainer}>
          <Text style={styles.contextLabel}>Additional context (optional):</Text>
          <TextInput
            style={styles.contextInput}
            placeholder="Provide any specific requirements or additional information"
            value={context}
            onChangeText={setContext}
            multiline
            numberOfLines={4}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.delegateButton,
            (!selectedTaskId || isDelegating) && styles.disabledButton,
          ]}
          onPress={handleDelegateTask}
          disabled={!selectedTaskId || isDelegating}
        >
          {isDelegating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.delegateButtonText}>
              Delegate to AI Assistant
            </Text>
          )}
        </TouchableOpacity>

        {delegationError && (
          <Text style={styles.errorText}>
            Error delegating task. Please try again.
          </Text>
        )}
      </View>
    );
  };

  // Render Smart Tasks tab
  const renderSmartTasks = () => {
    return <SmartTasks navigation={navigation} />;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'smart_tasks' && styles.activeTabButton]}
          onPress={() => setActiveTab('smart_tasks')}
        >
          <Ionicons
            name="flash-outline"
            size={20}
            color={activeTab === 'smart_tasks' ? '#6366f1' : '#6b7280'}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'smart_tasks' && styles.activeTabButtonText,
            ]}
          >
            AI Tools
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'suggestions' && styles.activeTabButton]}
          onPress={() => setActiveTab('suggestions')}
        >
          <Ionicons
            name="bulb-outline"
            size={20}
            color={activeTab === 'suggestions' ? '#6366f1' : '#6b7280'}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'suggestions' && styles.activeTabButtonText,
            ]}
          >
            Suggestions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'delegation' && styles.activeTabButton]}
          onPress={() => setActiveTab('delegation')}
        >
          <Ionicons
            name="construct-outline"
            size={20}
            color={activeTab === 'delegation' ? '#6366f1' : '#6b7280'}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'delegation' && styles.activeTabButtonText,
            ]}
          >
            Delegate
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'smart_tasks' 
        ? renderSmartTasks() 
        : activeTab === 'suggestions' 
          ? renderSuggestions() 
          : renderDelegation()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomColor: '#e5e7eb',
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#6366f1',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabButtonText: {
    color: '#6366f1',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
    padding: 20,
  },
  errorText: {
    color: '#ef4444',
    marginVertical: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  // Suggestions styles
  suggestionsContainer: {
    padding: 16,
  },
  suggestionGroup: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  groupDescription: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  stepIconContainer: {
    marginRight: 8,
    marginTop: 2,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    color: '#111827',
  },
  stepTime: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  // Delegation styles
  delegationContainer: {
    padding: 16,
    flex: 1,
  },
  delegationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 16,
  },
  taskList: {
    maxHeight: 200,
    marginBottom: 16,
  },
  taskItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectedTaskItem: {
    borderColor: '#6366f1',
    backgroundColor: '#eff6ff',
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 13,
    color: '#6b7280',
  },
  contextContainer: {
    marginBottom: 16,
  },
  contextLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  contextInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  delegateButton: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  delegateButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: '#c7d2fe',
  },
  // Delegation result styles
  delegationResultContainer: {
    padding: 16,
  },
  delegationResultHeader: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  delegationResultTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  delegationResultEstimate: {
    fontSize: 15,
    color: '#6366f1',
    fontWeight: '500',
  },
  delegationSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
  },
  delegationStepItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  delegationStepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
    fontWeight: '600',
  },
  delegationStepContent: {
    flex: 1,
  },
  delegationStepDescription: {
    fontSize: 15,
    color: '#111827',
    marginBottom: 2,
  },
  delegationStepTime: {
    fontSize: 13,
    color: '#6b7280',
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resourceText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6366f1',
    flex: 1,
  },
  backButton: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default AiAssistantScreen;