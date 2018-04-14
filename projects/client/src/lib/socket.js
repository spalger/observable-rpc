import io from 'socket.io-client'

export function createSocket(url) {
  const socket = io(url, {
    transports: ['websocket'],
    forceNew: true,
  })

  socket.on('reconnect_attempt', () => {
    socket.io.opts.transports = ['polling', 'websocket']
  })

  return socket
}
