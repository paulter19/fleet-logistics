import { useState } from 'react'
import { Modal } from './ui/Modal'
import { Field, Select, TextInput, Textarea } from './ui/Field'
import { Button } from './ui/Button'
import type { DVIRInput, DVIRType } from '../types'

const INSPECTION_ITEMS = [
  'Brakes & Air Lines',
  'Tires & Wheel Assemblies',
  'Lights & Reflectors',
  'Engine & Fluid Levels',
  'Steering Mechanism',
  'Fifth Wheel & Coupling',
  'Windshield & Wipers',
  'Safety Equipment & Fire Extinguisher',
]

export function DVIRModal({
  open,
  onClose,
  vehicleId,
  unitNumber,
  driverId,
  driverName,
  currentMileage,
  onSave,
}: {
  open: boolean
  onClose: () => void
  vehicleId: string
  unitNumber: string
  driverId: string | null
  driverName: string
  currentMileage: number
  onSave: (dvir: DVIRInput) => Promise<void>
}) {
  const [type, setType] = useState<DVIRType>('pre_trip')
  const [odometer, setOdometer] = useState(String(currentMileage))
  const [selectedDefects, setSelectedDefects] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [signedBy, setSignedBy] = useState(driverName || 'Driver Signoff')
  const [busy, setBusy] = useState(false)

  const toggleDefect = (item: string) => {
    setSelectedDefects((prev) =>
      prev.includes(item) ? prev.filter((d) => d !== item) : [...prev, item],
    )
  }

  const submit = async () => {
    setBusy(true)
    try {
      await onSave({
        vehicleId,
        driverId,
        type,
        status: selectedDefects.length > 0 ? 'defects_found' : 'passed',
        odometer: parseInt(odometer, 10) || currentMileage,
        inspectedAt: new Date().toISOString(),
        defects: selectedDefects,
        notes,
        signedBy,
      })
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`DVIR Inspection · ${unitNumber}`}>
      <div className="stack" style={{ gap: 14 }}>
        <p className="small muted">
          Driver Vehicle Inspection Report (DOT/FMCSA Pre-Trip & Post-Trip Checklist).
        </p>

        <div className="grid-2">
          <Field label="Inspection Type">
            <Select value={type} onChange={(e) => setType(e.target.value as DVIRType)}>
              <option value="pre_trip">Pre-Trip Inspection</option>
              <option value="post_trip">Post-Trip Inspection</option>
            </Select>
          </Field>
          <Field label="Odometer Reading">
            <TextInput
              type="number"
              value={odometer}
              onChange={(e) => setOdometer(e.target.value)}
            />
          </Field>
        </div>

        <div>
          <label className="field-label">Safety Inspection Checklist</label>
          <p className="small muted" style={{ marginBottom: 8 }}>
            Check any component with defects or requiring repair:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {INSPECTION_ITEMS.map((item) => {
              const isChecked = selectedDefects.includes(item)
              return (
                <label
                  key={item}
                  className="card"
                  style={{
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    background: isChecked ? 'var(--danger-bg)' : 'var(--surface-2)',
                    borderColor: isChecked ? 'var(--danger)' : 'var(--border)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleDefect(item)}
                  />
                  <span>{item}</span>
                </label>
              )
            })}
          </div>
        </div>

        <Field label="Remarks & Defect Details">
          <Textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe any issues discovered or note satisfactory condition..."
          />
        </Field>

        <Field label="Inspector / Driver Signature">
          <TextInput
            value={signedBy}
            onChange={(e) => setSignedBy(e.target.value)}
            placeholder="Full Name"
          />
        </Field>

        <div className="modal-actions" style={{ marginTop: 10 }}>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant={selectedDefects.length > 0 ? 'accent' : 'primary'}
            onClick={submit}
            disabled={busy}
          >
            {busy ? 'Saving...' : selectedDefects.length > 0 ? 'Submit with Defects' : 'Submit Passed Inspection'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
