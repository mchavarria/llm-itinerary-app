# Data Models

## EventType
Define the type of travel event:
```typescript
type EventType = 'flight' | 'train' | 'bus' | 'ferry' | 'accommodation';
```

## Source Metadata
Describes the origin of a given itinerary item:
```typescript
interface SourceMeta {
  provider: 'gmail' | 'outlook';
  messageId: string;
  sender: string;
  mailboxFolder: string;
  processedAt: string; // ISO UTC
}
```

## Itinerary Data Structures
Base structure inherited by all item types:
```typescript
interface BaseItineraryItem {
  id: string; // Unique ID
  eventType: EventType;
  datetimeUtc: string; // ISO UTC
  source: SourceMeta;
  warnings: ExtractionWarning[];
  isDeleted: boolean; // Soft-delete flag
  createdAt: string; // ISO UTC
  updatedAt: string; // ISO UTC
}
```
### Specialized Types
- Transportation Items:
```typescript
interface TransportationItem extends BaseItineraryItem {
  eventType: 'flight' | 'train' | 'bus' | 'ferry';
  providerName?: string;
  departureLocation?: string;
  arrivalLocation?: string;
  confirmationNumber?: string;
  passengerNames?: string[];
}
```
- Accommodation Items:
```typescript
interface AccommodationItem extends BaseItineraryItem {
  eventType: 'accommodation';
  propertyName?: string;
  address?: string;
  checkOutDatetimeUtc?: string;
  confirmationNumber?: string;
}
```
