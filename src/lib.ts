import { Address, BigDecimal, BigInt, dataSource, ethereum } from "@graphprotocol/graph-ts";
import { DayStat, GlobalStat } from "../generated/schema";
import { ScrollGasPrecompile } from "../generated/UniV3Pool/ScrollGasPrecompile";


let scrollGasPrecompile = Address.fromString('0x5300000000000000000000000000000000000002')

let eighteenDecimals = BigInt.fromI32(10).pow(18).toBigDecimal()
let twelveDecimals = BigInt.fromI32(10).pow(12).toBigDecimal()

let ONE_DAY = 86400

export function getGlobal(): GlobalStat {
  let globalStats = GlobalStat.load('1')
  if (!globalStats) {
    globalStats = new GlobalStat('1')

    globalStats.swapCount = 0
    globalStats.totalSwapCostETH = BigDecimal.zero()
    globalStats.averageSwapCostETH = BigDecimal.zero()
    globalStats.totalSwapCostUSD = BigDecimal.zero()
    globalStats.averageSwapCostUSD = BigDecimal.zero()

    globalStats.transferCount = 0
    globalStats.totalTransferCostETH = BigDecimal.zero()
    globalStats.averageTransferCostETH = BigDecimal.zero()
    globalStats.totalTransferCostUSD = BigDecimal.zero()
    globalStats.averageTransferCostUSD = BigDecimal.zero()

    globalStats.ethPrice = BigDecimal.zero()
  }
  return globalStats
}

export function getDay(timestamp: i32): DayStat {
  let dayId = timestamp / ONE_DAY
  let date = dayId * ONE_DAY

  let dayStats = DayStat.load(dayId.toString())
  if (!dayStats) {
    dayStats = new DayStat(dayId.toString())
    dayStats.date = date
    
    dayStats.swapCount = 0
    dayStats.totalSwapCostETH = BigDecimal.zero()
    dayStats.averageSwapCostETH = BigDecimal.zero()
    dayStats.totalSwapCostUSD = BigDecimal.zero()
    dayStats.averageSwapCostUSD = BigDecimal.zero()

    dayStats.transferCount = 0
    dayStats.totalTransferCostETH = BigDecimal.zero()
    dayStats.averageTransferCostETH = BigDecimal.zero()
    dayStats.totalTransferCostUSD = BigDecimal.zero()
    dayStats.averageTransferCostUSD = BigDecimal.zero()
  }
  return dayStats
}

export function getEthPrice(amount0: BigInt, amount1: BigInt): BigDecimal {
  let chainId = dataSource.network()
  let ratio = chainId == 'mainnet'
    ? amount0.toBigDecimal().div(amount1.toBigDecimal())
    : amount1.toBigDecimal().div(amount0.toBigDecimal())

  if (ratio.lt(BigDecimal.zero())) {
    ratio = ratio.neg()
  }

  return ratio.times(twelveDecimals)
}

export function getGasPrice(event: ethereum.Event): BigInt {
  let chainId = dataSource.network()
  return event.transaction.gasPrice
}

export function getEthFee(event: ethereum.Event): BigDecimal {
  let chainId = dataSource.network()
  let gasPrice = getGasPrice(event)

  if (chainId == 'scroll') {
    let l2Fee = event.receipt!.gasUsed.times(gasPrice)
    let l1Fee = ScrollGasPrecompile.bind(scrollGasPrecompile).getL1Fee(event.transaction.input)
    return l2Fee.plus(l1Fee).divDecimal(eighteenDecimals)
  }

  return event.receipt!.gasUsed.times(gasPrice).divDecimal(eighteenDecimals)
}

