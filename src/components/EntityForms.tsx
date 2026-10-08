import { useEffect, useState, type FormEvent } from 'react'
import type {
  Driver,
  DriverInput,
  DriverStatus,
  FuelLogInput,
  LicenseClass,
  Load,
  LoadInput,
  LoadPriority,
  LoadStatus,
  MaintenanceInput,
  MaintenanceOrder,
  MaintenanceStatus,
  MaintenanceType,
  Trip,
  TripInput,
  TripStatus,
  Vehicle,
  VehicleInput,
  VehicleStatus,
  VehicleType,
} from '../types'
import { firstError, required } from '../utils/validation'
import { Button } from './ui/Button'
import { Field, Select, TextInput, Textarea } from './ui/Field'
import { Modal } from './ui/Modal'

type Named = { id: string; name: string }

function useFormState<T>(open: boolean, make: () => T) {
  const [values, setValues] = useState<T>(make)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setValues(make())
    setErrors({})
    setBusy(false)
  }, [open])

  return { values, setValues, errors, setErrors, busy, setBusy }
}

export function VehicleFormModal({
  open,
  onClose,
  initial,
  drivers,
  onSave,
}: {
  open: boolean
  onClose: () => void
  initial?: Vehicle | null
  drivers: Named[]
  onSave: (input: VehicleInput) => Promise<void>
}) {
  const make = (): VehicleInput =>
    initial
      ? { ...initial }
      : {
          unitNumber: '',
          vin: '',
          plate: '',
          make: '',
          model: '',
          year: new Date().getFullYear(),
          type: 'tractor',
          status: 'idle',
          mileage: 0,
          location: '',
          assignedDriverId: null,
          fuelLevel: 80,
          lastServiceAt: new Date().toISOString().slice(0, 10),
          nextServiceDueMiles: 10000,
        }
  const form = useFormState(open, make)
  const set = <K extends keyof VehicleInput>(key: K, value: VehicleInput[K]) =>
    form.setValues((c) => ({ ...c, [key]: value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    const unit = firstError([required(form.values.unitNumber, 'Unit number')])
    const vin = firstError([required(form.values.vin, 'VIN')])
    const makeErr = firstError([required(form.values.make, 'Make')])
    if (unit) next.unitNumber = unit
    if (vin) next.vin = vin
    if (makeErr) next.make = makeErr
    if (form.values.year < 1990 || form.values.year > 2030) next.year = 'Enter a valid year.'
    form.setErrors(next)
    if (Object.keys(next).length) return
    form.setBusy(true)
    try {
      await onSave(form.values)
      onClose()
    } finally {
      form.setBusy(false)
    }
  }

  return (
    <Modal
      title={initial ? `Edit ${initial.unitNumber}` : 'Add vehicle'}
      open={open}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose} disabled={form.busy}>
            Cancel
          </Button>
          <Button type="submit" form="vehicle-form" disabled={form.busy}>
            {form.busy ? 'Saving…' : 'Save vehicle'}
          </Button>
        </>
      }
    >
      <form id="vehicle-form" className="form-grid" onSubmit={submit}>
        <Field label="Unit number" error={form.errors.unitNumber}>
          <TextInput value={form.values.unitNumber} onChange={(e) => set('unitNumber', e.target.value)} />
        </Field>
        <Field label="Plate">
          <TextInput value={form.values.plate} onChange={(e) => set('plate', e.target.value)} />
        </Field>
        <Field label="VIN" error={form.errors.vin} className="span-2">
          <TextInput value={form.values.vin} onChange={(e) => set('vin', e.target.value)} />
        </Field>
        <Field label="Make" error={form.errors.make}>
          <TextInput value={form.values.make} onChange={(e) => set('make', e.target.value)} />
        </Field>
        <Field label="Model">
          <TextInput value={form.values.model} onChange={(e) => set('model', e.target.value)} />
        </Field>
        <Field label="Year" error={form.errors.year}>
          <TextInput type="number" value={form.values.year} onChange={(e) => set('year', Number(e.target.value))} />
        </Field>
        <Field label="Type">
          <Select value={form.values.type} onChange={(e) => set('type', e.target.value as VehicleType)}>
            <option value="tractor">Tractor</option>
            <option value="straight_truck">Straight truck</option>
            <option value="van">Van</option>
            <option value="reefer">Reefer</option>
          </Select>
        </Field>
        <Field label="Status">
          <Select value={form.values.status} onChange={(e) => set('status', e.target.value as VehicleStatus)}>
            <option value="active">Active</option>
            <option value="idle">Idle</option>
            <option value="maintenance">Maintenance</option>
            <option value="out_of_service">Out of service</option>
          </Select>
        </Field>
        <Field label="Location">
          <TextInput value={form.values.location} onChange={(e) => set('location', e.target.value)} />
        </Field>
        <Field label="Mileage">
          <TextInput type="number" value={form.values.mileage} onChange={(e) => set('mileage', Number(e.target.value))} />
        </Field>
        <Field label="Fuel %">
          <TextInput type="number" value={form.values.fuelLevel} onChange={(e) => set('fuelLevel', Number(e.target.value))} />
        </Field>
        <Field label="Assigned driver">
          <Select
            value={form.values.assignedDriverId ?? ''}
            onChange={(e) => set('assignedDriverId', e.target.value || null)}
          >
            <option value="">Unassigned</option>
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Last service">
          <TextInput type="date" value={form.values.lastServiceAt} onChange={(e) => set('lastServiceAt', e.target.value)} />
        </Field>
        <Field label="Next service due (miles)">
          <TextInput
            type="number"
            value={form.values.nextServiceDueMiles}
            onChange={(e) => set('nextServiceDueMiles', Number(e.target.value))}
          />
        </Field>
      </form>
    </Modal>
  )
}

export function DriverFormModal({
  open,
  onClose,
  initial,
  vehicles,
  onSave,
}: {
  open: boolean
  onClose: () => void
  initial?: Driver | null
  vehicles: Named[]
  onSave: (input: DriverInput) => Promise<void>
}) {
  const make = (): DriverInput =>
    initial
      ? { ...initial }
      : {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          status: 'available',
          licenseClass: 'CDL-A',
          licenseNumber: '',
          licenseExpiresAt: '',
          hireDate: new Date().toISOString().slice(0, 10),
          hosHoursRemaining: 11,
          assignedVehicleId: null,
          homeTerminal: 'Dallas',
        }
  const form = useFormState(open, make)
  const set = <K extends keyof DriverInput>(key: K, value: DriverInput[K]) =>
    form.setValues((c) => ({ ...c, [key]: value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    const first = firstError([required(form.values.firstName, 'First name')])
    const last = firstError([required(form.values.lastName, 'Last name')])
    const email = firstError([required(form.values.email, 'Email')])
    if (first) next.firstName = first
    if (last) next.lastName = last
    if (email) next.email = email
    form.setErrors(next)
    if (Object.keys(next).length) return
    form.setBusy(true)
    try {
      await onSave(form.values)
      onClose()
    } finally {
      form.setBusy(false)
    }
  }

  return (
    <Modal
      title={initial ? `Edit ${initial.firstName} ${initial.lastName}` : 'Add driver'}
      open={open}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose} disabled={form.busy}>
            Cancel
          </Button>
          <Button type="submit" form="driver-form" disabled={form.busy}>
            {form.busy ? 'Saving…' : 'Save driver'}
          </Button>
        </>
      }
    >
      <form id="driver-form" className="form-grid" onSubmit={submit}>
        <Field label="First name" error={form.errors.firstName}>
          <TextInput value={form.values.firstName} onChange={(e) => set('firstName', e.target.value)} />
        </Field>
        <Field label="Last name" error={form.errors.lastName}>
          <TextInput value={form.values.lastName} onChange={(e) => set('lastName', e.target.value)} />
        </Field>
        <Field label="Email" error={form.errors.email}>
          <TextInput type="email" value={form.values.email} onChange={(e) => set('email', e.target.value)} />
        </Field>
        <Field label="Phone">
          <TextInput value={form.values.phone} onChange={(e) => set('phone', e.target.value)} />
        </Field>
        <Field label="Status">
          <Select value={form.values.status} onChange={(e) => set('status', e.target.value as DriverStatus)}>
            <option value="available">Available</option>
            <option value="on_trip">On trip</option>
            <option value="off_duty">Off duty</option>
            <option value="on_leave">On leave</option>
          </Select>
        </Field>
        <Field label="License class">
          <Select value={form.values.licenseClass} onChange={(e) => set('licenseClass', e.target.value as LicenseClass)}>
            <option>CDL-A</option>
            <option>CDL-B</option>
            <option>CDL-C</option>
          </Select>
        </Field>
        <Field label="License number">
          <TextInput value={form.values.licenseNumber} onChange={(e) => set('licenseNumber', e.target.value)} />
        </Field>
        <Field label="License expires">
          <TextInput
            type="date"
            value={form.values.licenseExpiresAt}
            onChange={(e) => set('licenseExpiresAt', e.target.value)}
          />
        </Field>
        <Field label="Hire date">
          <TextInput type="date" value={form.values.hireDate} onChange={(e) => set('hireDate', e.target.value)} />
        </Field>
        <Field label="HOS hours remaining">
          <TextInput
            type="number"
            step="0.25"
            value={form.values.hosHoursRemaining}
            onChange={(e) => set('hosHoursRemaining', Number(e.target.value))}
          />
        </Field>
        <Field label="Home terminal">
          <TextInput value={form.values.homeTerminal} onChange={(e) => set('homeTerminal', e.target.value)} />
        </Field>
        <Field label="Assigned vehicle">
          <Select
            value={form.values.assignedVehicleId ?? ''}
            onChange={(e) => set('assignedVehicleId', e.target.value || null)}
          >
            <option value="">Unassigned</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.name}
              </option>
            ))}
          </Select>
        </Field>
      </form>
    </Modal>
  )
}

export function TripFormModal({
  open,
  onClose,
  initial,
  vehicles,
  drivers,
  loads,
  onSave,
}: {
  open: boolean
  onClose: () => void
  initial?: Trip | null
  vehicles: Named[]
  drivers: Named[]
  loads: Named[]
  onSave: (input: TripInput) => Promise<void>
}) {
  const make = (): TripInput =>
    initial
      ? { ...initial }
      : {
          tripNumber: `TRP-${Math.floor(8900 + Math.random() * 100)}`,
          origin: '',
          destination: '',
          vehicleId: null,
          driverId: null,
          loadId: null,
          status: 'scheduled',
          scheduledStart: new Date().toISOString().slice(0, 16),
          eta: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
          miles: 0,
          progress: 0,
          notes: '',
        }
  const form = useFormState(open, make)
  const set = <K extends keyof TripInput>(key: K, value: TripInput[K]) =>
    form.setValues((c) => ({ ...c, [key]: value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    const origin = firstError([required(form.values.origin, 'Origin')])
    const dest = firstError([required(form.values.destination, 'Destination')])
    if (origin) next.origin = origin
    if (dest) next.destination = dest
    form.setErrors(next)
    if (Object.keys(next).length) return
    form.setBusy(true)
    try {
      await onSave(form.values)
      onClose()
    } finally {
      form.setBusy(false)
    }
  }

  return (
    <Modal
      title={initial ? `Edit ${initial.tripNumber}` : 'Create trip'}
      open={open}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose} disabled={form.busy}>
            Cancel
          </Button>
          <Button type="submit" form="trip-form" disabled={form.busy}>
            {form.busy ? 'Saving…' : 'Save trip'}
          </Button>
        </>
      }
    >
      <form id="trip-form" className="form-grid" onSubmit={submit}>
        <Field label="Trip number">
          <TextInput value={form.values.tripNumber} onChange={(e) => set('tripNumber', e.target.value)} />
        </Field>
        <Field label="Status">
          <Select value={form.values.status} onChange={(e) => set('status', e.target.value as TripStatus)}>
            <option value="scheduled">Scheduled</option>
            <option value="in_transit">In transit</option>
            <option value="delayed">Delayed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </Field>
        <Field label="Origin" error={form.errors.origin}>
          <TextInput value={form.values.origin} onChange={(e) => set('origin', e.target.value)} />
        </Field>
        <Field label="Destination" error={form.errors.destination}>
          <TextInput value={form.values.destination} onChange={(e) => set('destination', e.target.value)} />
        </Field>
        <Field label="Vehicle">
          <Select value={form.values.vehicleId ?? ''} onChange={(e) => set('vehicleId', e.target.value || null)}>
            <option value="">Unassigned</option>
            {vehicles.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Driver">
          <Select value={form.values.driverId ?? ''} onChange={(e) => set('driverId', e.target.value || null)}>
            <option value="">Unassigned</option>
            {drivers.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Load">
          <Select value={form.values.loadId ?? ''} onChange={(e) => set('loadId', e.target.value || null)}>
            <option value="">None</option>
            {loads.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Miles">
          <TextInput type="number" value={form.values.miles} onChange={(e) => set('miles', Number(e.target.value))} />
        </Field>
        <Field label="Scheduled start">
          <TextInput
            type="datetime-local"
            value={form.values.scheduledStart.slice(0, 16)}
            onChange={(e) => set('scheduledStart', e.target.value)}
          />
        </Field>
        <Field label="ETA">
          <TextInput type="datetime-local" value={form.values.eta.slice(0, 16)} onChange={(e) => set('eta', e.target.value)} />
        </Field>
        <Field label="Progress %">
          <TextInput type="number" value={form.values.progress} onChange={(e) => set('progress', Number(e.target.value))} />
        </Field>
        <Field label="Notes" className="span-2">
          <Textarea value={form.values.notes} onChange={(e) => set('notes', e.target.value)} />
        </Field>
      </form>
    </Modal>
  )
}

export function LoadFormModal({
  open,
  onClose,
  initial,
  trips,
  onSave,
}: {
  open: boolean
  onClose: () => void
  initial?: Load | null
  trips: Named[]
  onSave: (input: LoadInput) => Promise<void>
}) {
  const make = (): LoadInput =>
    initial
      ? { ...initial }
      : {
          loadNumber: `LD-${Math.floor(4500 + Math.random() * 200)}`,
          customer: '',
          pickup: '',
          dropoff: '',
          commodity: '',
          weightLbs: 0,
          pieces: 1,
          status: 'pending',
          priority: 'standard',
          revenue: 0,
          pickupWindow: '',
          deliveryWindow: '',
          assignedTripId: null,
        }
  const form = useFormState(open, make)
  const set = <K extends keyof LoadInput>(key: K, value: LoadInput[K]) =>
    form.setValues((c) => ({ ...c, [key]: value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    const customer = firstError([required(form.values.customer, 'Customer')])
    const pickup = firstError([required(form.values.pickup, 'Pickup')])
    if (customer) next.customer = customer
    if (pickup) next.pickup = pickup
    form.setErrors(next)
    if (Object.keys(next).length) return
    form.setBusy(true)
    try {
      await onSave(form.values)
      onClose()
    } finally {
      form.setBusy(false)
    }
  }

  return (
    <Modal
      title={initial ? `Edit ${initial.loadNumber}` : 'Create load'}
      open={open}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose} disabled={form.busy}>
            Cancel
          </Button>
          <Button type="submit" form="load-form" disabled={form.busy}>
            {form.busy ? 'Saving…' : 'Save load'}
          </Button>
        </>
      }
    >
      <form id="load-form" className="form-grid" onSubmit={submit}>
        <Field label="Load number">
          <TextInput value={form.values.loadNumber} onChange={(e) => set('loadNumber', e.target.value)} />
        </Field>
        <Field label="Customer" error={form.errors.customer}>
          <TextInput value={form.values.customer} onChange={(e) => set('customer', e.target.value)} />
        </Field>
        <Field label="Pickup" error={form.errors.pickup}>
          <TextInput value={form.values.pickup} onChange={(e) => set('pickup', e.target.value)} />
        </Field>
        <Field label="Dropoff">
          <TextInput value={form.values.dropoff} onChange={(e) => set('dropoff', e.target.value)} />
        </Field>
        <Field label="Commodity">
          <TextInput value={form.values.commodity} onChange={(e) => set('commodity', e.target.value)} />
        </Field>
        <Field label="Priority">
          <Select value={form.values.priority} onChange={(e) => set('priority', e.target.value as LoadPriority)}>
            <option value="standard">Standard</option>
            <option value="expedited">Expedited</option>
            <option value="critical">Critical</option>
          </Select>
        </Field>
        <Field label="Status">
          <Select value={form.values.status} onChange={(e) => set('status', e.target.value as LoadStatus)}>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="in_transit">In transit</option>
            <option value="delivered">Delivered</option>
            <option value="exception">Exception</option>
          </Select>
        </Field>
        <Field label="Trip">
          <Select
            value={form.values.assignedTripId ?? ''}
            onChange={(e) => set('assignedTripId', e.target.value || null)}
          >
            <option value="">Unassigned</option>
            {trips.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Weight (lbs)">
          <TextInput type="number" value={form.values.weightLbs} onChange={(e) => set('weightLbs', Number(e.target.value))} />
        </Field>
        <Field label="Pieces">
          <TextInput type="number" value={form.values.pieces} onChange={(e) => set('pieces', Number(e.target.value))} />
        </Field>
        <Field label="Revenue">
          <TextInput type="number" value={form.values.revenue} onChange={(e) => set('revenue', Number(e.target.value))} />
        </Field>
        <Field label="Pickup window">
          <TextInput value={form.values.pickupWindow} onChange={(e) => set('pickupWindow', e.target.value)} />
        </Field>
        <Field label="Delivery window">
          <TextInput value={form.values.deliveryWindow} onChange={(e) => set('deliveryWindow', e.target.value)} />
        </Field>
      </form>
    </Modal>
  )
}

export function MaintenanceFormModal({
  open,
  onClose,
  initial,
  vehicles,
  onSave,
}: {
  open: boolean
  onClose: () => void
  initial?: MaintenanceOrder | null
  vehicles: Named[]
  onSave: (input: MaintenanceInput) => Promise<void>
}) {
  const make = (): MaintenanceInput =>
    initial
      ? { ...initial }
      : {
          workOrder: `WO-${Math.floor(1900 + Math.random() * 200)}`,
          vehicleId: vehicles[0]?.id ?? '',
          type: 'preventive',
          status: 'scheduled',
          title: '',
          vendor: 'In-house shop',
          scheduledAt: new Date().toISOString().slice(0, 10),
          completedAt: null,
          cost: 0,
          notes: '',
        }
  const form = useFormState(open, make)
  const set = <K extends keyof MaintenanceInput>(key: K, value: MaintenanceInput[K]) =>
    form.setValues((c) => ({ ...c, [key]: value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    const title = firstError([required(form.values.title, 'Title')])
    if (title) next.title = title
    if (!form.values.vehicleId) next.vehicleId = 'Select a vehicle.'
    form.setErrors(next)
    if (Object.keys(next).length) return
    form.setBusy(true)
    try {
      await onSave(form.values)
      onClose()
    } finally {
      form.setBusy(false)
    }
  }

  return (
    <Modal
      title={initial ? `Edit ${initial.workOrder}` : 'New work order'}
      open={open}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose} disabled={form.busy}>
            Cancel
          </Button>
          <Button type="submit" form="mnt-form" disabled={form.busy}>
            {form.busy ? 'Saving…' : 'Save work order'}
          </Button>
        </>
      }
    >
      <form id="mnt-form" className="form-grid" onSubmit={submit}>
        <Field label="Work order">
          <TextInput value={form.values.workOrder} onChange={(e) => set('workOrder', e.target.value)} />
        </Field>
        <Field label="Vehicle" error={form.errors.vehicleId}>
          <Select value={form.values.vehicleId} onChange={(e) => set('vehicleId', e.target.value)}>
            <option value="">Select</option>
            {vehicles.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Title" error={form.errors.title} className="span-2">
          <TextInput value={form.values.title} onChange={(e) => set('title', e.target.value)} />
        </Field>
        <Field label="Type">
          <Select value={form.values.type} onChange={(e) => set('type', e.target.value as MaintenanceType)}>
            <option value="preventive">Preventive</option>
            <option value="repair">Repair</option>
            <option value="inspection">Inspection</option>
            <option value="recall">Recall</option>
          </Select>
        </Field>
        <Field label="Status">
          <Select value={form.values.status} onChange={(e) => set('status', e.target.value as MaintenanceStatus)}>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </Select>
        </Field>
        <Field label="Vendor">
          <TextInput value={form.values.vendor} onChange={(e) => set('vendor', e.target.value)} />
        </Field>
        <Field label="Cost">
          <TextInput type="number" value={form.values.cost} onChange={(e) => set('cost', Number(e.target.value))} />
        </Field>
        <Field label="Scheduled">
          <TextInput type="date" value={form.values.scheduledAt} onChange={(e) => set('scheduledAt', e.target.value)} />
        </Field>
        <Field label="Completed">
          <TextInput
            type="date"
            value={form.values.completedAt ?? ''}
            onChange={(e) => set('completedAt', e.target.value || null)}
          />
        </Field>
        <Field label="Notes" className="span-2">
          <Textarea value={form.values.notes} onChange={(e) => set('notes', e.target.value)} />
        </Field>
      </form>
    </Modal>
  )
}

export function FuelFormModal({
  open,
  onClose,
  vehicles,
  drivers,
  onSave,
}: {
  open: boolean
  onClose: () => void
  vehicles: Named[]
  drivers: Named[]
  onSave: (input: FuelLogInput) => Promise<void>
}) {
  const make = (): FuelLogInput => ({
    vehicleId: vehicles[0]?.id ?? '',
    driverId: null,
    filledAt: new Date().toISOString().slice(0, 16),
    gallons: 0,
    pricePerGallon: 3.5,
    station: '',
    location: '',
    odometer: 0,
  })
  const form = useFormState(open, make)
  const set = <K extends keyof FuelLogInput>(key: K, value: FuelLogInput[K]) =>
    form.setValues((c) => ({ ...c, [key]: value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (!form.values.vehicleId) next.vehicleId = 'Select a vehicle.'
    if (form.values.gallons <= 0) next.gallons = 'Enter gallons.'
    form.setErrors(next)
    if (Object.keys(next).length) return
    form.setBusy(true)
    try {
      await onSave(form.values)
      onClose()
    } finally {
      form.setBusy(false)
    }
  }

  return (
    <Modal
      title="Log fuel purchase"
      open={open}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose} disabled={form.busy}>
            Cancel
          </Button>
          <Button type="submit" form="fuel-form" disabled={form.busy}>
            {form.busy ? 'Saving…' : 'Save fuel log'}
          </Button>
        </>
      }
    >
      <form id="fuel-form" className="form-grid" onSubmit={submit}>
        <Field label="Vehicle" error={form.errors.vehicleId}>
          <Select value={form.values.vehicleId} onChange={(e) => set('vehicleId', e.target.value)}>
            <option value="">Select</option>
            {vehicles.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Driver">
          <Select value={form.values.driverId ?? ''} onChange={(e) => set('driverId', e.target.value || null)}>
            <option value="">Unknown</option>
            {drivers.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Gallons" error={form.errors.gallons}>
          <TextInput type="number" step="0.1" value={form.values.gallons} onChange={(e) => set('gallons', Number(e.target.value))} />
        </Field>
        <Field label="Price / gallon">
          <TextInput
            type="number"
            step="0.01"
            value={form.values.pricePerGallon}
            onChange={(e) => set('pricePerGallon', Number(e.target.value))}
          />
        </Field>
        <Field label="Station">
          <TextInput value={form.values.station} onChange={(e) => set('station', e.target.value)} />
        </Field>
        <Field label="Location">
          <TextInput value={form.values.location} onChange={(e) => set('location', e.target.value)} />
        </Field>
        <Field label="Filled at">
          <TextInput
            type="datetime-local"
            value={form.values.filledAt.slice(0, 16)}
            onChange={(e) => set('filledAt', e.target.value)}
          />
        </Field>
        <Field label="Odometer">
          <TextInput type="number" value={form.values.odometer} onChange={(e) => set('odometer', Number(e.target.value))} />
        </Field>
      </form>
    </Modal>
  )
}
