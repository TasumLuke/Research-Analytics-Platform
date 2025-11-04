// shows toast messages to the user
import { useMessages } from "@/bits/message-hook";
import { 
  MessageBox, 
  MessageClose, 
  MessageText, 
  MessageProvider, 
  MessageTitle, 
  MessageContainer 
} from "@/bits/message-parts";

/**
 * Renders all active toast notifs for the user. Retreives current message.
 * @component
 * @returns {JSX.Element}
 */
export function PopupMessages() {
  const { messages } = useMessages();

  return (
    <MessageProvider>
      {messages.map(function ({ id, title, description, action, ...otherStuff }) {
        return (
          <MessageBox key={id} {...otherStuff}>
            <div className="grid gap-1">
              {title && <MessageTitle>{title}</MessageTitle>}
              {description && <MessageText>{description}</MessageText>}
            </div>
            {action}
            <MessageClose />
          </MessageBox>
        );
      })}
      <MessageContainer />
    </MessageProvider>
  );
}
