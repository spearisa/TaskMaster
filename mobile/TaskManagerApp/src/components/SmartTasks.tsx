import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Smart task type definition
interface SmartTask {
  id: number;
  title: string;
  dueDate?: string; // Optional for tasks like "Create a flyer" that don't have a due date
  icon: 'chatbubble' | 'image' | 'alarm' | 'checkmark'; // Icons for different types of AI tools
  aiTool: 'ChatGPT' | 'DALL-E' | 'Reminder' | 'Completed';
  status: 'pending' | 'completed';
  color: string;
}

export const SmartTasks = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState('chat');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [currentReminderTask, setCurrentReminderTask] = useState<SmartTask | null>(null);
  const [selectedNotification, setSelectedNotification] = useState('15min');

  // Example smart tasks
  const smartTasks: SmartTask[] = [
    {
      id: 1,
      title: 'Finish report using ChatGPT',
      dueDate: 'Tomorrow 3:00 PM',
      icon: 'chatbubble',
      aiTool: 'ChatGPT',
      status: 'pending',
      color: '#6366f1',
    },
    {
      id: 2,
      title: 'Create a flyer',
      icon: 'image',
      aiTool: 'DALL-E',
      status: 'pending',
      color: '#10b981',
    },
    {
      id: 3,
      title: 'Remind me to review notes',
      dueDate: 'Tomorrow 1:00 PM',
      icon: 'alarm',
      aiTool: 'Reminder',
      status: 'pending',
      color: '#6366f1',
    },
    {
      id: 4,
      title: 'Fix email reply',
      icon: 'checkmark',
      aiTool: 'Completed',
      status: 'completed',
      color: '#10b981',
    },
  ];

  const renderTaskIcon = (task: SmartTask) => {
    let iconName = '';
    switch (task.icon) {
      case 'chatbubble':
        iconName = 'chatbubble-outline';
        break;
      case 'image':
        iconName = 'image-outline';
        break;
      case 'alarm':
        iconName = 'alarm-outline';
        break;
      case 'checkmark':
        iconName = 'checkmark-circle-outline';
        break;
      default:
        iconName = 'help-circle-outline';
    }

    return <Ionicons name={iconName} size={24} color="#fff" />;
  };

  const renderActionButton = (task: SmartTask) => {
    if (task.status === 'completed') {
      return null;
    }

    let buttonText = '';
    switch (task.aiTool) {
      case 'ChatGPT':
        buttonText = 'Launch ChatGPT';
        break;
      case 'DALL-E':
        buttonText = 'Open DALL·E';
        break;
      case 'Reminder':
        buttonText = 'Set Reminder';
        break;
    }

    return (
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => handleTaskAction(task)}
      >
        <Text style={styles.actionButtonText}>{buttonText}</Text>
      </TouchableOpacity>
    );
  };

  const handleTaskAction = (task: SmartTask) => {
    if (task.aiTool === 'Reminder') {
      // Open reminder modal
      setCurrentReminderTask(task);
      setReminderModalVisible(true);
    } else {
      // Handle other AI tools
      Alert.alert(`Launching ${task.aiTool}`, `Starting ${task.aiTool} for task: ${task.title}`);
    }
  };

  const handlePromptSubmit = () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      alert(`Sending prompt to ${activeTab}: ${prompt}`);
      setPrompt('');
    }, 1500);
  };

  const renderToolSelector = () => {
    return (
      <View style={styles.toolSelector}>
        <TouchableOpacity
          style={[styles.toolButton, activeTab === 'chat' && styles.activeToolButton]}
          onPress={() => setActiveTab('chat')}
        >
          <Ionicons
            name="chatbubble-outline"
            size={20}
            color={activeTab === 'chat' ? '#6366f1' : '#6b7280'}
          />
          <Text
            style={[
              styles.toolButtonText,
              activeTab === 'chat' && styles.activeToolButtonText,
            ]}
          >
            Chat
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolButton, activeTab === 'image' && styles.activeToolButton]}
          onPress={() => setActiveTab('image')}
        >
          <Ionicons
            name="image-outline"
            size={20}
            color={activeTab === 'image' ? '#6366f1' : '#6b7280'}
          />
          <Text
            style={[
              styles.toolButtonText,
              activeTab === 'image' && styles.activeToolButtonText,
            ]}
          >
            Image
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolButton, activeTab === 'code' && styles.activeToolButton]}
          onPress={() => setActiveTab('code')}
        >
          <Ionicons
            name="code-slash-outline"
            size={20}
            color={activeTab === 'code' ? '#6366f1' : '#6b7280'}
          />
          <Text
            style={[
              styles.toolButtonText,
              activeTab === 'code' && styles.activeToolButtonText,
            ]}
          >
            Code
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolButton, activeTab === 'music' && styles.activeToolButton]}
          onPress={() => setActiveTab('music')}
        >
          <Ionicons
            name="musical-notes-outline"
            size={20}
            color={activeTab === 'music' ? '#6366f1' : '#6b7280'}
          />
          <Text
            style={[
              styles.toolButtonText,
              activeTab === 'music' && styles.activeToolButtonText,
            ]}
          >
            Music
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const getPromptPlaceholder = () => {
    switch (activeTab) {
      case 'chat':
        return 'Enter your prompt...';
      case 'image':
        return 'Describe the image you want to generate...';
      case 'code':
        return 'Describe the code you want to generate...';
      case 'music':
        return 'Describe the music you want to generate...';
      default:
        return 'Enter your prompt...';
    }
  };

  const getSubmitButtonText = () => {
    switch (activeTab) {
      case 'chat':
        return 'Submit';
      case 'image':
      case 'code':
      case 'music':
        return 'Generate';
      default:
        return 'Submit';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Tools</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search-outline" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <View style={styles.toolSelectorContainer}>
        {renderToolSelector()}
      </View>

      <View style={styles.promptContainer}>
        <TextInput
          style={styles.promptInput}
          placeholder={getPromptPlaceholder()}
          value={prompt}
          onChangeText={setPrompt}
          multiline={activeTab === 'chat'}
        />
        <TouchableOpacity
          style={[styles.submitButton, !prompt.trim() && styles.disabledButton]}
          onPress={handlePromptSubmit}
          disabled={!prompt.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>{getSubmitButtonText()}</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.smartTasksSection}>
        <Text style={styles.sectionTitle}>Smart Tasks</Text>
        <Text style={styles.sectionSubtitle}>AI-powered to-do list</Text>

        <FlatList
          data={smartTasks}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.taskCard}>
              <View
                style={[styles.taskIconContainer, { backgroundColor: item.color }]}
              >
                {renderTaskIcon(item)}
              </View>
              <View style={styles.taskDetails}>
                <Text
                  style={[
                    styles.taskTitle,
                    item.status === 'completed' && styles.completedTaskTitle,
                  ]}
                >
                  {item.title}
                </Text>
                {item.dueDate && (
                  <Text style={styles.taskDueDate}>{item.dueDate}</Text>
                )}
                {item.status === 'completed' && (
                  <Text style={styles.completedText}>Completed</Text>
                )}
                {item.aiTool === 'DALL-E' && !item.dueDate && (
                  <Text style={styles.aiPoweredText}>AI-Powered</Text>
                )}
              </View>
              {renderActionButton(item)}
            </View>
          )}
          scrollEnabled={false}
        />
      </View>

      {/* Reminder Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={reminderModalVisible}
        onRequestClose={() => setReminderModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Ionicons name="alarm-outline" size={24} color="#3B82F6" />
                <Text style={styles.modalTitle}>Set Reminder</Text>
              </View>
              <Text style={styles.modalSubtitle}>{currentReminderTask?.title}</Text>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>When:</Text>
                <Text style={styles.modalValue}>{currentReminderTask?.dueDate}</Text>
              </View>

              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Notify:</Text>
                <View style={styles.pickerContainer}>
                  <TouchableOpacity 
                    style={styles.pickerButton}
                    onPress={() => {
                      // In a real app, we would show a proper picker here
                      setSelectedNotification('15min');
                    }}
                  >
                    <Text style={styles.pickerButtonText}>
                      {(() => {
                        switch(selectedNotification) {
                          case '5min': return '5 minutes before';
                          case '15min': return '15 minutes before';
                          case '30min': return '30 minutes before';
                          case '1hour': return '1 hour before';
                          case '1day': return '1 day before';
                          default: return '15 minutes before';
                        }
                      })()}
                    </Text>
                    <Ionicons name="chevron-down-outline" size={16} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setReminderModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalConfirmButton}
                onPress={() => {
                  Alert.alert(
                    "Reminder Set",
                    `You will be reminded to ${currentReminderTask?.title.toLowerCase()} at ${currentReminderTask?.dueDate}`
                  );
                  setReminderModalVisible(false);
                }}
              >
                <Text style={styles.modalConfirmButtonText}>Set Reminder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  searchButton: {
    padding: 8,
  },
  toolSelectorContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  toolSelector: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  toolButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeToolButton: {
    borderBottomColor: '#6366f1',
  },
  toolButtonText: {
    fontSize: 12,
    marginTop: 4,
    color: '#6b7280',
  },
  activeToolButtonText: {
    color: '#6366f1',
  },
  promptContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 16,
    marginTop: 0,
    marginBottom: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  promptInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    marginBottom: 16,
    minHeight: 44,
  },
  submitButton: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#c7d2fe',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  smartTasksSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  taskIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  taskDetails: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  completedTaskTitle: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  taskDueDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  completedText: {
    fontSize: 14,
    color: '#10b981',
  },
  aiPoweredText: {
    fontSize: 14,
    color: '#6b7280',
  },
  actionButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionButtonText: {
    color: '#6366f1',
    fontWeight: '500',
    fontSize: 14,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '100%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    marginBottom: 20,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  modalBody: {
    marginBottom: 24,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '500',
    width: 80,
  },
  modalValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  pickerContainer: {
    flex: 1,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#4b5563',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  modalCancelButtonText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  modalConfirmButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalConfirmButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
});

export default SmartTasks;