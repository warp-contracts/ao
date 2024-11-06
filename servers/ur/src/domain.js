import { SequentialRoundRobin } from 'round-robin-js'

// TODO: do sth less stupid..
const ORACLE = ['g4_Dzk3Ib-PBY3rnvbpGkKpG6fU_DBBy4PSaaUpQcGE', '8Iietx7-KxAENUD7QKjXrMUilgMUaDYra0Jp7L80v2M']

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
