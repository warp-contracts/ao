import { of, Rejected, fromPromise, Resolved } from 'hyper-async'

import { getCuAddressWith } from '../lib/get-cu-address.js'
import { writeMessageTxWith } from '../lib/write-message-tx.js'
import { pullResultWith } from '../lib/pull-result.js'
import { parseDataItemWith } from '../lib/parse-data-item.js'
import { verifyParsedDataItemWith } from '../lib/verify-parsed-data-item.js'
import { writeProcessTxWith } from '../lib/write-process-tx.js'
import { getSchedulerOwner, setSchedulerOwner } from '../lib/su-cache.js'

/**
 * Forward along the DataItem to the SU,
 *
 * and conditionally crank based on whether the DataItem
 * is an ao Message or not
 */
export function sendDataItemWith ({
  selectNode,
  createDataItem,
  writeDataItem,
  locateScheduler,
  locateProcess,
  fetchResult,
  crank,
  logger,
  fetchSchedulerProcess,
  writeDataItemArweave,
  db
}) {
  const verifyParsedDataItem = verifyParsedDataItemWith()
  const parseDataItem = parseDataItemWith({ createDataItem, logger })
  const getCuAddress = getCuAddressWith({ selectNode, logger })
  const writeMessage = writeMessageTxWith({ locateProcess, writeDataItem, logger, fetchSchedulerProcess, writeDataItemArweave })
  const pullResult = pullResultWith({ fetchResult, logger })
  const writeProcess = writeProcessTxWith({ locateScheduler, writeDataItem, logger })

  const locateProcessLocal = fromPromise(locateProcess)

  /**
     * If the data item is a Message, then cranking and tracing
     * must also be performed.
     */
  const sendMessage = (ctx) => of({ ...ctx, message: ctx.dataItem })
    .map(({ message, ...rest }) => ({
      ...rest,
      message
    }))
    .chain(({ message, ...rest }) =>
      of({ ...rest })
        .chain(writeMessage)
        .bichain(
          (error) => {
            return of(error)
              .map(logger.tap('Initial message failed %s', message.id))
              .chain(() => Rejected(error))
          },
          (res) => Resolved(res)
        )
        .map(res => ({
          ...res,
          /**
             * An opaque method to fetch the result of the message just forwarded
             * and then crank its results
             */
          crank: () => of({ ...res, initialTxId: res.tx.id })
            .chain(getCuAddress)
            .chain(pullResult)
            .chain(({ msgs, spawns, assigns, initialTxId }) => crank({
              msgs,
              spawns,
              assigns,
              initialTxId
            }))
            .bimap(
              logger.tap('Failed to crank messages'),
              logger.tap('Cranking complete')
            )
        }))
    )

  /**
     * Simply write the process to the SU
     * and return a noop crank
     */
  const sendProcess = (ctx) => of(ctx)
    .chain(writeProcess)
    .map((res) => ({
      ...res,
      /**
         * There is nothing to crank for a process sent to the MU,
         *
         * so the crank method will simply noop, keeping the behavior
         * a black box
         */
      crank: () => of({ res })
        .chain(({ res }) => {
          const hasTargetTag = res.dataItem.tags.find((tag) => tag.name === 'Target')
          if (hasTargetTag) {
            return Rejected({ res })
          }
          const schedulerTag = res.dataItem.tags.find((tag) => tag.name === 'Scheduler')
          setSchedulerOwner(db, res.dataItem.id, schedulerTag.value)
          return Resolved()
        })
        .bichain(({ res }) => {
          const assigns = [{ Message: res.dataItem.id, Processes: res.dataItem.tags.filter((tag) => tag.name === 'Target').map((tag) => tag.value) }]
          return crank({
            msgs: [],
            spawns: [],
            assigns,
            initialTxId: res.tx.id
          })
        }, Resolved)
        .bimap(
          logger.tap('Assignments cranked for Process DataItem.'),
          logger.tap('No cranking for a Process DataItem without target required. Nooping...'))
    }))

  return (ctx) => {
    return of(ctx)
      .chain(parseDataItem)
      .chain((ctx) =>
        verifyParsedDataItem(ctx.dataItem)
          .chain(({ isMessage }) => {
            if (isMessage) {
              /*
                  add schedLocation into the context if the
                  target is a process. if its a wallet dont add
                  schedLocation and it will get sent directly to
                  Arweave
              */
              return locateProcessLocal(ctx.dataItem.target, getSchedulerOwner(db, ctx.dataItem.target))
                .chain((schedLocation) => sendMessage({ ...ctx, schedLocation }))
            }
            return sendProcess(ctx)
          })
      )
  }
}
