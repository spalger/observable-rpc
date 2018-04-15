import { format as formatUrl, parse as parseUrl } from 'url'

import io from 'socket.io-client'

export function createSocket(url) {
  const { protocol, host, path } = parseUrl(url)

  // always attempt websockets first
  const socket = io(formatUrl({ protocol, host }), {
    transports: ['websocket'],
    forceNew: true,
    path,
  })

  // try polling if websockets fail
  socket.on('reconnect_attempt', () => {
    socket.io.opts.transports = ['polling', 'websocket']
  })

  return socket
}
