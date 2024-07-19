import { SequentialRoundRobin } from 'round-robin-js'

// TODO: do sth less stupid..
const ORACLE = ['_b21c1djDesKI5LPXBZvZbXKdkTgQIx2FsN2HXtFsqQ']

export const bailoutWith = () => {
  throw new Error('Not implemented.')
}

/**
 * The pure business logic.
 *
 * Given a list of valid hosts, return a function that given the processId and failoverAttempt
 * will return a deterministic host from the valid hosts list.
 *
 * If the failoverAttempt exceeds the length of valid hosts list, then every host has
 * been attempted, and so return undefined, to be handled upstream
 */
export function determineHostWith ({ hosts = [] }) {
  const hostsRoundRobinTable = new SequentialRoundRobin(hosts)
  const processToHostCache = new Map()

  return async ({ processId, failoverAttempt = 0 }) => {
    if (ORACLE.includes(processId)) {
      return hosts[0]
    }
    if (failoverAttempt >= hosts.length) return

    let cachedHost = processToHostCache.get(processId)
    if (!cachedHost) {
      cachedHost = hostsRoundRobinTable.next().value
      processToHostCache.set(processId, cachedHost)
    }

    return cachedHost
  }
}
