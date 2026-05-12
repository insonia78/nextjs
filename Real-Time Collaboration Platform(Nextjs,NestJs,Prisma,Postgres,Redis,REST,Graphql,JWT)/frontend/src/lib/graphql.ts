import { gql } from '@apollo/client';

// Chat / Channels
export const GET_CHANNELS = gql`
  query GetChannels($teamId: String!) {
    channelsByTeam(teamId: $teamId) {
      id name type createdAt
    }
  }
`;

export const CREATE_CHANNEL = gql`
  mutation CreateChannel($name: String!, $teamId: String!, $type: String) {
    createChannel(name: $name, teamId: $teamId, type: $type) {
      id name type createdAt
    }
  }
`;

export const GET_MESSAGES = gql`
  query GetMessages($channelId: String!, $take: Int, $skip: Int) {
    messages(channelId: $channelId, take: $take, skip: $skip) {
      id content senderId channelId createdAt editedAt
    }
  }
`;

export const SEND_MESSAGE = gql`
  mutation SendMessage($content: String!, $senderId: String!, $channelId: String!) {
    sendMessage(content: $content, senderId: $senderId, channelId: $channelId) {
      id content senderId channelId createdAt
    }
  }
`;

export const MESSAGE_ADDED = gql`
  subscription MessageAdded($channelId: String!) {
    messageAdded(channelId: $channelId) {
      id content senderId channelId createdAt
    }
  }
`;

// Tasks
export const GET_TASKS = gql`
  query GetTasks($teamId: String!) {
    tasksByTeam(teamId: $teamId) {
      id title description status priority assignedTo teamId dueDate createdBy createdAt updatedAt
    }
  }
`;

export const CREATE_TASK = gql`
  mutation CreateTask(
    $title: String!
    $teamId: String!
    $createdBy: String!
    $description: String
    $assignedTo: String
    $priority: Priority
    $dueDate: DateTime
  ) {
    createTask(
      title: $title
      teamId: $teamId
      createdBy: $createdBy
      description: $description
      assignedTo: $assignedTo
      priority: $priority
      dueDate: $dueDate
    ) {
      id title status priority assignedTo createdAt
    }
  }
`;

export const UPDATE_TASK_STATUS = gql`
  mutation UpdateTaskStatus($id: String!, $status: TaskStatus!) {
    updateTaskStatus(id: $id, status: $status) {
      id status updatedAt
    }
  }
`;

export const DELETE_TASK = gql`
  mutation DeleteTask($id: String!) {
    deleteTask(id: $id) { id }
  }
`;

// Documents
export const GET_DOCUMENTS = gql`
  query GetDocuments($teamId: String!) {
    documentsByTeam(teamId: $teamId) {
      id title content teamId authorId createdAt updatedAt
    }
  }
`;

export const GET_DOCUMENT = gql`
  query GetDocument($id: String!) {
    document(id: $id) {
      id title content teamId authorId createdAt updatedAt
    }
  }
`;

export const CREATE_DOCUMENT = gql`
  mutation CreateDocument($title: String!, $teamId: String!, $authorId: String!) {
    createDocument(title: $title, teamId: $teamId, authorId: $authorId) {
      id title createdAt
    }
  }
`;

export const UPDATE_DOCUMENT_CONTENT = gql`
  mutation UpdateDocumentContent($id: String!, $content: String!) {
    updateDocumentContent(id: $id, content: $content) {
      id content updatedAt
    }
  }
`;

export const UPDATE_DOCUMENT_TITLE = gql`
  mutation UpdateDocumentTitle($id: String!, $title: String!) {
    updateDocumentTitle(id: $id, title: $title) {
      id title updatedAt
    }
  }
`;
