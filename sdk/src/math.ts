import { BN } from '@project-serum/anchor'
import { BondSaleStruct, Decimal } from './sale'
import { DECIMAL, DENOMINATOR, toDecimal, toScale } from './utils'

export const calculatePriceAfterSlippage = (priceSqrt: Decimal, slippage: Decimal) => {
  const multiplier = slippage.v.add(DENOMINATOR)

  return { v: priceSqrt.v.mul(multiplier).div(DENOMINATOR) }
}

export const calculateSellPrice = (bondSale: BondSaleStruct, amount: BN) => {
  const currentTime = new BN(Math.floor(Date.now() / 1000))
  console.log(currentTime.toString())
  const deltaTime = toScale(currentTime.sub(bondSale.lastTrade), DECIMAL)
  const saleTime = toScale(bondSale.endTime.sub(bondSale.startTime), DECIMAL)
  const timeRatio = decimalDiv(deltaTime, saleTime)

  const deltaPrice = decimalMul(
    decimalMul(decimalMul(bondSale.velocity.v, bondSale.upBound.v), bondSale.floorPrice.v),
    timeRatio
  )
  const supplyRatio = amount.mul(DENOMINATOR).div(bondSale.bondAmount.v)

  let price: BN
  if (bondSale.previousPrice.v.lt(bondSale.floorPrice.v)) {
    price = bondSale.floorPrice.v
  } else {
    price = bondSale.previousPrice.v.sub(deltaPrice)
  }

  const jump = decimalMul(decimalMul(supplyRatio, bondSale.upBound.v), bondSale.floorPrice.v)

  return price.add(decimalMul(toDecimal(5, 1).v, jump))
}

export const decimalMul = (one: BN, two: BN) => {
  return one.mul(two).div(DENOMINATOR)
}

export const decimalDiv = (one: BN, two: BN) => {
  return one.mul(DENOMINATOR).div(two)
}
