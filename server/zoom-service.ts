
import axios from 'axios';

// Zoom API configuration 
const ZOOM_API_BASE = 'https://api.zoom.us/v2';

export interface ZoomMeeting {
  id: string;
  join_url: string;
  start_url: string;
  password?: string;
  start_time: string;
  duration: number;
}

export async function createZoomMeeting(token: string, params: {
  topic: string;
  start_time: string; 
  duration: number;
  agenda?: string;
}) {
  try {
    const response = await axios.post(`${ZOOM_API_BASE}/users/me/meetings`, {
      topic: params.topic,
      type: 2, // Scheduled meeting
      start_time: params.start_time,
      duration: params.duration,
      agenda: params.agenda,
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: true,
        waiting_room: true,
      }
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data as ZoomMeeting;
  } catch (error) {
    console.error('Error creating Zoom meeting:', error);
    throw error;
  }
}
