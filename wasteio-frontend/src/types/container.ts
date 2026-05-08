export type WasteType = 'general' | 'recycling' | 'organic' | 'hazardous'
export type ContainerStatus = 'active' | 'maintenance' | 'offline'

export interface Container {
  id: string
  name?: string
  address?: string
  wasteType?: WasteType
  capacityLiters?: number
  fillLevel: number
  batteryLevel: number
  status: ContainerStatus
  lastPickup?: string
  location: { lat: number; lng: number }
}

export type ContainerFormData = Pick<
  Container,
  'name' | 'address' | 'wasteType' | 'capacityLiters' | 'status' | 'location'
>