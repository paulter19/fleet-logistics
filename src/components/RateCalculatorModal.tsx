import { useState } from 'react'
import { Modal } from './ui/Modal'
import { Field, TextInput } from './ui/Field'
import { Button } from './ui/Button'
import { formatMoney } from '../utils/format'

export function RateCalculatorModal({
  open,
  onClose,
  initialMiles = 650,
  initialRevenue = 1850,
}: {
  open: boolean
  onClose: () => void
  initialMiles?: number
  initialRevenue?: number
}) {
  const [miles, setMiles] = useState(String(initialMiles))
  const [revenue, setRevenue] = useState(String(initialRevenue))
  const [driverRatePerMile, setDriverRatePerMile] = useState('0.68')
  const [fuelPricePerGal, setFuelPricePerGal] = useState('3.85')
  const [avgMpg, setAvgMpg] = useState('6.5')
  const [tollsAndFees, setTollsAndFees] = useState('85')
  const [targetMarginPct, setTargetMarginPct] = useState('20')

  const parsedMiles = Math.max(parseFloat(miles) || 0, 0)
  const parsedRev = Math.max(parseFloat(revenue) || 0, 0)
  const parsedDriverRate = Math.max(parseFloat(driverRatePerMile) || 0, 0)
  const parsedFuelPrice = Math.max(parseFloat(fuelPricePerGal) || 0, 0)
  const parsedMpg = Math.max(parseFloat(avgMpg) || 1, 0.1)
  const parsedTolls = Math.max(parseFloat(tollsAndFees) || 0, 0)
  const parsedMargin = Math.max(parseFloat(targetMarginPct) || 0, 0)

  // Calculations
  const gallonsNeeded = parsedMiles / parsedMpg
  const totalFuelCost = gallonsNeeded * parsedFuelPrice
  const totalDriverPay = parsedMiles * parsedDriverRate
  const totalTripCost = totalFuelCost + totalDriverPay + parsedTolls
  
  const calculatedGrossProfit = parsedRev - totalTripCost
  const actualMarginPct = parsedRev > 0 ? (calculatedGrossProfit / parsedRev) * 100 : 0
  const recommendedRate = totalTripCost / (1 - parsedMargin / 100)
  const ratePerMile = parsedMiles > 0 ? parsedRev / parsedMiles : 0

  return (
    <Modal open={open} onClose={onClose} title="Freight Rate & Trip Cost Calculator">
      <div className="stack" style={{ gap: 16 }}>
        <p className="small muted">
          Estimate trip operational costs, driver compensation, and evaluate profitability for spot or contract lanes.
        </p>

        <div className="grid-2">
          <Field label="Trip Miles">
            <TextInput
              type="number"
              value={miles}
              onChange={(e) => setMiles(e.target.value)}
              placeholder="e.g. 650"
            />
          </Field>
          <Field label="Quoted Revenue ($)">
            <TextInput
              type="number"
              value={revenue}
              onChange={(e) => setRevenue(e.target.value)}
              placeholder="e.g. 1850"
            />
          </Field>
          <Field label="Driver Pay ($/mile)">
            <TextInput
              type="number"
              step="0.01"
              value={driverRatePerMile}
              onChange={(e) => setDriverRatePerMile(e.target.value)}
            />
          </Field>
          <Field label="Diesel Price ($/gal)">
            <TextInput
              type="number"
              step="0.01"
              value={fuelPricePerGal}
              onChange={(e) => setFuelPricePerGal(e.target.value)}
            />
          </Field>
          <Field label="Fleet Avg MPG">
            <TextInput
              type="number"
              step="0.1"
              value={avgMpg}
              onChange={(e) => setAvgMpg(e.target.value)}
            />
          </Field>
          <Field label="Tolls / Accessorial ($)">
            <TextInput
              type="number"
              value={tollsAndFees}
              onChange={(e) => setTollsAndFees(e.target.value)}
            />
          </Field>
          <Field label="Target Profit Margin (%)">
            <TextInput
              type="number"
              value={targetMarginPct}
              onChange={(e) => setTargetMarginPct(e.target.value)}
            />
          </Field>
        </div>

        {/* Breakdown Card */}
        <div className="card card-pad" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <div className="card-head">
            <strong>Financial Analysis</strong>
            <span className={`tag ${calculatedGrossProfit >= 0 ? 'active' : 'out_of_service'}`}>
              {actualMarginPct.toFixed(1)}% Margin
            </span>
          </div>

          <dl className="kv" style={{ marginTop: 8 }}>
            <dt>Fuel Expense ({gallonsNeeded.toFixed(1)} gal)</dt>
            <dd>{formatMoney(totalFuelCost, true)}</dd>
            <dt>Driver Compensation</dt>
            <dd>{formatMoney(totalDriverPay, true)}</dd>
            <dt>Tolls & Accessorials</dt>
            <dd>{formatMoney(parsedTolls, true)}</dd>
            <dt style={{ fontWeight: 700 }}>Total Estimated Cost</dt>
            <dd style={{ fontWeight: 700 }}>{formatMoney(totalTripCost, true)}</dd>
            <dt style={{ fontWeight: 700 }}>Gross Profit</dt>
            <dd style={{ fontWeight: 700, color: calculatedGrossProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {formatMoney(calculatedGrossProfit, true)}
            </dd>
            <dt>Rate per Mile (RPM)</dt>
            <dd>${ratePerMile.toFixed(2)}/mi</dd>
            <dt>Target {parsedMargin}% Margin Rate</dt>
            <dd className="cell-strong">{formatMoney(recommendedRate, true)}</dd>
          </dl>
        </div>

        <div className="modal-actions" style={{ marginTop: 8 }}>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={() => {
              setRevenue(String(Math.round(recommendedRate)))
            }}
          >
            Apply Target Rate ({formatMoney(recommendedRate)})
          </Button>
        </div>
      </div>
    </Modal>
  )
}
