import {toast} from 'sonner';
import axios from 'axios';

interface ChatChannel {
  id: string;
  lastMessage: string;
  lastActive: Date;
}

interface ChatMessage {
  user: string;
  message: string;
  user_type:string;
  userName:string;
  timestamp: string;
}

export const getMessages = async(token:string,channelId:string): Promise<ChatMessage[]|null> => {
  let data:ChatMessage[] | null = null;
  try{
    // Construct the URL with query parameters
    const url = `${import.meta.env.VITE_BACKEND_URL}/chats/messages/${channelId}`;

    const fetchMessages = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept-Language':'es'
      }
    });

    return fetchMessages.data;


  }catch(error){
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const errorData = error.response?.data;
      const errorMessage = errorData?.error;

      if (Array.isArray(errorMessage)) {
        // Handle validation errors (array of errors)
        errorMessage.forEach((err) => {
          toast.error(err.msg || 'Validation error occurred');
        });
      } else {
        // Handle other types of errors
        if (statusCode) {
          toast.error(`${errorData?.error || "Error fetching the messages."} (Code: ${statusCode})`);
        } else {
          toast.error(errorData?.error || "An error occurred.");
        }
      }
    } else {
      toast.error("An unexpected error occurred.");
    }
    console.error(error);
  }

  return data;
}

export const getAllWebChats = async( token: string, page:Number ): Promise<ChatChannel[]|null> => {

  let data:ChatChannel[] | null = null;
  try{

    // Create a URLSearchParams object to construct the query string
    const params = new URLSearchParams();
    params.append('page', page.toString());

    // Construct the URL with query parameters
    const url = `${import.meta.env.VITE_BACKEND_URL}/chats?${params.toString()}`;

    const fetchChats = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept-Language':'es'
      }
    });

    return fetchChats.data;


  }catch(error){
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const errorData = error.response?.data;
      const errorMessage = errorData?.error;

      if (Array.isArray(errorMessage)) {
        // Handle validation errors (array of errors)
        errorMessage.forEach((err) => {
          toast.error(err.msg || 'Validation error occurred');
        });
      } else {
        // Handle other types of errors
        if (statusCode) {
          toast.error(`${errorData?.error || "Error fetching the chats."} (Code: ${statusCode})`);
        } else {
          toast.error(errorData?.error || "An error occurred.");
        }
      }
    } else {
      toast.error("An unexpected error occurred.");
    }
    console.error(error);
  }

  return data;
}
