import { BN } from '@project-serum/anchor'
import { BondSaleStruct, BondStruct, Decimal } from './sale'
import { DECIMAL, DENOMINATOR, toDecimal, toScale } from './utils'

export const getPriceAfterSlippage = (price: Decimal, slippage: Decimal) => {
  return price.v.mul(slippage.v.add(DENOMINATOR)).div(DENOMINATOR)
}

export const calculateSellPrice = (bondSale: BondSaleStruct, amount: BN) => {
  const currentTime = new BN(Math.floor(Date.now() / 1000))
  const deltaTime = toScale(currentTime.sub(bondSale.lastTrade), DECIMAL)
  const saleTime = toScale(bondSale.endTime.sub(bondSale.startTime), DECIMAL)
  const timeRatio = decimalDiv(deltaTime, saleTime)

  const deltaPrice = decimalMul(
    decimalMul(decimalMul(bondSale.velocity.v, bondSale.upBound.v), bondSale.floorPrice.v),
    timeRatio
  )
  const supplyRatio = amount.mul(DENOMINATOR).div(bondSale.supply.v)

  let price: BN
  if (bondSale.previousPrice.v.lt(bondSale.floorPrice.v)) {
    price = bondSale.floorPrice.v
  } else {
    price = bondSale.previousPrice.v.sub(deltaPrice)
  }

  const jump = decimalMul(decimalMul(supplyRatio, bondSale.upBound.v), bondSale.floorPrice.v)

  return price.add(decimalMul(toDecimal(new BN(5), 1).v, jump))
}

export const calculateAmountToClaim = (bond: BondStruct) => {
  const currentTime = new BN(Math.floor(Date.now() / 1000))

  let timeDelta: BN
  if (currentTime.lt(bond.vestingEnd)) {
    timeDelta = currentTime.sub(bond.lastClaim)
  } else {
    timeDelta = bond.vestingEnd.sub(bond.lastClaim)
  }

  const duration = bond.vestingEnd.sub(bond.vestingStart)
  const fraction = decimalDiv(toDecimal(timeDelta, 0).v, toDecimal(duration, 0).v)

  const amountToClaim = decimalMul(bond.bondAmount.v, fraction)

  return amountToClaim
}

export const decimalMul = (one: BN, two: BN) => {
  return one.mul(two).div(DENOMINATOR)
}

export const decimalDiv = (one: BN, two: BN) => {
  return one.mul(DENOMINATOR).div(two)
}

export const getCeilPrice = (upBound: Decimal, floorPrice: Decimal) => {
  return toDecimal(new BN(1), 0).v.add(upBound.v).mul(floorPrice.v).div(DENOMINATOR)
}
