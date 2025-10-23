// hook for showing popup messages across the app
import * as React from "react";
import type { MessageAction as MessageActionEl, MessageProps } from "@/bits/message-parts";

const MAX_MESSAGES = 1; // only show one at a time

type PopupMessage = MessageProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
};

const actions = {
  ADD_MESSAGE: "ADD_MESSAGE",
  UPDATE_MESSAGE: "UPDATE_MESSAGE",
  HIDE_MESSAGE: "HIDE_MESSAGE",
  REMOVE_MESSAGE: "REMOVE_MESSAGE",
} as const;

let counter = 0;

function makeId() {
  counter = (counter + 1) % Number.MAX_SAFE_INTEGER;
  return counter.toString();
}

type ActionType = typeof actions;

type Action =
  | { type: ActionType["ADD_MESSAGE"]; message: PopupMessage }
  | { type: ActionType["UPDATE_MESSAGE"]; message: Partial<PopupMessage> }
  | { type: ActionType["HIDE_MESSAGE"]; messageId?: PopupMessage["id"] }
  | { type: ActionType["REMOVE_MESSAGE"]; messageId?: PopupMessage["id"] };

interface State {
  messages: PopupMessage[];
}

const timers = new Map<string, ReturnType<typeof setTimeout>>();

const queueForRemoval = (messageId: string) => {
  if (timers.has(messageId)) return;

  const timer = setTimeout(() => {
    timers.delete(messageId);
    dispatch({ type: "REMOVE_MESSAGE", messageId: messageId });
  }, 1000000);

  timers.set(messageId, timer);
};

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_MESSAGE":
      return {
        ...state,
        messages: [action.message, ...state.messages].slice(0, MAX_MESSAGES),
      };

    case "UPDATE_MESSAGE":
      return {
        ...state,
        messages: state.messages.map((msg) => 
          msg.id === action.message.id ? { ...msg, ...action.message } : msg
        ),
      };

    case "HIDE_MESSAGE": {
      const { messageId } = action;
      if (messageId) {
        queueForRemoval(messageId);
      } else {
        state.messages.forEach((msg) => queueForRemoval(msg.id));
      }

      return {
        ...state,
        messages: state.messages.map((msg) =>
          msg.id === messageId || messageId === undefined
            ? { ...msg, open: false }
            : msg
        ),
      };
    }

    case "REMOVE_MESSAGE":
      if (action.messageId === undefined) {
        return { ...state, messages: [] };
      }
      return {
        ...state,
        messages: state.messages.filter((msg) => msg.id !== action.messageId),
      };
  }
};

const watchers: Array<(state: State) => void> = [];
let currentState: State = { messages: [] };

function dispatch(action: Action) {
  currentState = reducer(currentState, action);
  watchers.forEach((watcher) => watcher(currentState));
}

type Message = Omit<PopupMessage, "id">;

function showMessage({ ...props }: Message) {
  const id = makeId();

  const update = (props: PopupMessage) =>
    dispatch({ type: "UPDATE_MESSAGE", message: { ...props, id } });
  
  const hide = () => dispatch({ type: "HIDE_MESSAGE", messageId: id });

  dispatch({
    type: "ADD_MESSAGE",
    message: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) hide();
      },
    },
  });

  return { id, hide, update };
}

function useMessages() {
  const [state, setState] = React.useState<State>(currentState);

  React.useEffect(() => {
    watchers.push(setState);
    return () => {
      const idx = watchers.indexOf(setState);
      if (idx > -1) watchers.splice(idx, 1);
    };
  }, [state]);

  return {
    ...state,
    showMessage,
    hide: (messageId?: string) => dispatch({ type: "HIDE_MESSAGE", messageId }),
  };
}

export { useMessages, showMessage };
