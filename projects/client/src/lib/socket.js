import io from 'socket.io-client'

export function createSocket(url) {
  // always attempt websockets first
  const socket = io(url, {
    transports: ['websocket'],
    forceNew: true,
  })

  // try polling if websockets fail
  socket.on('reconnect_attempt', () => {
    socket.io.opts.transports = ['polling', 'websocket']
  })

  return socket
}
