import { io } from 'socket.io-client'
import isEmpty from './validation/isEmpty'
import store from './store'
import { SERVER_URL } from './config'
import { addMessage, setTarget, updateContact, updateNugeFlag } from './store/slice/chatSlice'

export const socket = io(isEmpty(SERVER_URL) ? '/' : SERVER_URL, { transports: ["websocket"] })
socket.disconnect()
socket.on('connect', () => {
    socket.emit('userInfo', store.getState().auth.user)
})
const nudgeTimeoutID = 0
socket.on('newMessage', (message) => {
    const { user } = store.getState().auth
    const { target } = store.getState().chat
    if (message.mode == 1 && target.mode == 1 || (message.sender._id == user._id && message.receiver == target._id || message.sender._id == target._id && message.receiver == user._id)) {
        store.dispatch(addMessage(message))
        if (message.type == 1 && message.sender._id != user._id) {
            store.dispatch(updateNugeFlag(0))
            setTimeout(() => store.dispatch(updateNugeFlag(1)), 1)
        }
    }
})

socket.on('updateContact', (contact, temp) => {
    store.dispatch(updateContact(contact))
    if (contact._id == store.getState().chat.target._id) {
        store.dispatch(setTarget(contact))
    }
})
export default socket;