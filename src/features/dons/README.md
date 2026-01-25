# Feature: Dons (Donations)

## Overview

The Dons (Donations) feature manages the donation system for RETROUVONSLES. It provides complete functionality for accepting, tracking, and managing financial contributions from donors to support the search for missing persons.

## Directory Structure

```
dons/
├── components/          # React UI components
│   ├── DonationForm.tsx
│   ├── DonationHistory.tsx
│   ├── DonationStats.tsx
│   ├── DonationSuccess.tsx
│   ├── PaymentMethods.tsx
│   └── index.ts
├── hooks/              # Custom React hooks
│   ├── useDons.ts
│   ├── useDonationCreate.ts
│   ├── useDonationHistory.ts
│   └── index.ts
├── services/           # Business logic & API calls
│   ├── donAPI.ts      # Direct Supabase operations
│   ├── donService.ts  # Business logic & transformations
│   ├── paymentService.ts # Payment processing
│   └── index.ts
├── store/             # Redux state management
│   ├── donSlice.ts    # Reducer & actions
│   ├── donSelectors.ts # Selectors
│   └── index.ts
├── types/             # TypeScript type definitions
│   ├── don.types.ts
│   └── index.ts
└── index.ts          # Main export file
```

## Key Components

### DonationForm
A comprehensive form for creating donations with:
- Amount input with currency selection
- Donation type selector (ponctuel, mensuel, annuel, etc.)
- Optional donor information
- Payment method selection
- Message field for donors
- Form validation with error display

```typescript
<DonationForm 
  onSuccess={(donId) => console.log('Created:', donId)}
  onCancel={() => handleCancel()}
  showPaymentOptions={true}
/>
```

### DonationHistory
Displays donation history with status tracking:
- Shows recent donations or specific donor's history
- Color-coded status badges
- Formatted amounts and relative dates
- Optional message display

```typescript
<DonationHistory 
  email="donor@example.com"
  limit={10}
  showRecent={false}
/>
```

### DonationStats
Real-time statistics dashboard:
- Total donations count
- Total amount raised
- Average donation amount
- Success rate
- Breakdown by type, method, and status

```typescript
<DonationStats />
```

### DonationSuccess
Success confirmation screen:
- Transaction details
- Receipt number (if available)
- Option to print receipt
- Confirmation message

```typescript
<DonationSuccess 
  donationAmount={50000}
  donationCurrency="XAF"
  transactionId="TRX-123"
  onPrintReceipt={() => window.print()}
/>
```

### PaymentMethods
Interactive payment method selector:
- 5 predefined payment methods
- Method-specific information and fees
- Keyboard accessible

```typescript
<PaymentMethods 
  selectedMethod="carte_bancaire"
  onSelectMethod={(method) => handlePaymentMethod(method)}
/>
```

## Custom Hooks

### useDons
Main hook for donation management:
```typescript
const { 
  dons, 
  loading, 
  error,
  fetchDons,
  createDon,
  updateDonStatus,
  deleteDon
} = useDons();
```

### useDonationCreate
Form creation and payment processing:
```typescript
const {
  formData,
  validationErrors,
  isProcessing,
  submitDonation,
  processPayment,
  resetForm
} = useDonationCreate();
```

### useDonationHistory
Manage donation history and statistics:
```typescript
const {
  donationHistory,
  recentDonations,
  statistics,
  fetchDonorHistory,
  fetchRecentDonations,
  fetchStatistics
} = useDonationHistory();
```

## Services

### donAPI.ts
Direct Supabase database operations:
- CRUD operations on don table
- Payment status updates
- Receipt generation
- Statistics calculations
- Donation history queries

### donService.ts
Business logic and data transformations:
- Form validation
- Data enrichment (formatting, labels, dates)
- Display data preparation
- Calculation logic

### paymentService.ts
Payment processing and gateway integration:
- Payment initiation
- Payment verification
- Refund processing
- Transaction reference generation
- Payment data validation

## State Management

### Redux Slice (donSlice.ts)
- 40+ actions for comprehensive state management
- Support for pagination, filtering, sorting
- Selection management
- Error handling

### Selectors (donSelectors.ts)
50+ selectors for efficient state access:
- Basic queries: selectDons, selectPaginatedDons
- Filtering: selectDonsByStatus, selectDonsByType
- Calculations: selectTotalAmount, selectAverageDonAmount
- UI states: selectIsLoading, selectIsCreating

```typescript
import { selectDons, selectStatistics, selectTotalAmount } from '@/features/dons';

const dons = selectDons(state);
const total = selectTotalAmount(state);
const stats = selectStatistics(state);
```

## Types & Interfaces

All TypeScript types are defined in `types/don.types.ts`:

- **DonFormValues**: Form input structure
- **DonDisplayData**: Enriched data for display
- **DonValidationErrors**: Validation error messages
- **DonStatistics**: Donation statistics
- **DonStoreState**: Redux state shape
- **PaymentMethod/PaymentConfig**: Payment system types
- **DonFilterCriteria**: Query filter options

Database types are imported from `@/@types`:
- **Don**: Main donation interface (from database.types.ts)
- **TypeDon**: Enum for donation types
- **MethodePaiement**: Enum for payment methods
- **StatutPaiement**: Enum for payment status

## Usage Examples

### Basic Donation Creation

```typescript
import { useDonationCreate, DonationForm } from '@/features/dons';

function DonationPage() {
  const { submitDonation, createdDon } = useDonationCreate();

  const handleFormSubmit = async (formData) => {
    try {
      const don = await submitDonation(formData);
      console.log('Donation created:', don);
    } catch (error) {
      console.error('Failed to create donation:', error);
    }
  };

  return <DonationForm onSuccess={handleFormSubmit} />;
}
```

### Display Donation Statistics

```typescript
import { DonationStats } from '@/features/dons';

function StatsPage() {
  return (
    <div>
      <h1>Donation Statistics</h1>
      <DonationStats />
    </div>
  );
}
```

### Manage Donations

```typescript
import { useDons } from '@/features/dons';

function DonationsManager() {
  const { 
    dons, 
    loading, 
    fetchDons,
    updateDonStatus 
  } = useDons();

  useEffect(() => {
    fetchDons({ statut: ['en_attente'] });
  }, [fetchDons]);

  const handleMarkAsProcessed = async (donId) => {
    await updateDonStatus(donId, 'reussi');
  };

  return (
    <div>
      {loading ? <Spinner /> : (
        <DonationList 
          donations={dons} 
          onProcess={handleMarkAsProcessed}
        />
      )}
    </div>
  );
}
```

## Database Tables

The feature uses the `don` table in Supabase with fields:
- `id`: UUID primary key
- `montant`: Donation amount
- `devise`: Currency (default: XAF)
- `type_don`: Type of donation (enum)
- `methode_paiement`: Payment method (enum)
- `statut_paiement`: Payment status (enum)
- `donateur_anonyme`: Anonymous flag
- `nom_donateur`: Donor name (if not anonymous)
- `email_donateur`: Donor email
- `telephone_donateur`: Donor phone
- `organisation_donatrice`: Donor organization
- `message_donateur`: Donor message
- `reference_transaction`: Payment reference
- `date_don`: Donation date
- `remerciement_envoye`: Thank you sent flag
- `recu_fiscal_genere`: Receipt generated flag
- `numero_recu`: Fiscal receipt number

## Payment Processing

The feature includes a mock payment processing system ready for integration with real payment gateways:

**Supported Payment Methods:**
- Carte Bancaire (Credit Card)
- Mobile Money (MTN, Orange)
- Virement Bancaire (Bank Transfer)
- PayPal
- Autre (Custom)

**Integration Points:**
- `paymentService.initiatePayment()`: Start payment
- `paymentService.verifyPayment()`: Verify payment completion
- `paymentService.handlePaymentCallback()`: Process callback

## Accessibility

The feature includes:
- Proper form labels and ARIA attributes
- Keyboard navigation support
- Color-blind friendly status indicators
- Screen reader friendly content
- Semantic HTML structure

## Responsive Design

All components are mobile-responsive with:
- Flexible layouts
- Touch-friendly controls
- Optimized spacing for small screens
- Readable text sizes

## Error Handling

Comprehensive error handling includes:
- Form validation errors with field-level messages
- API error handling with user-friendly messages
- Payment failure handling
- Network error recovery

## Future Enhancements

- [ ] Real payment gateway integration (Stripe, PayPal, etc.)
- [ ] Recurring donation scheduling
- [ ] Donor dashboard
- [ ] Donation campaigns
- [ ] Tax deduction calculations
- [ ] Email receipts with HTML templates
- [ ] SMS confirmations
- [ ] Donation export reports
- [ ] Admin donation management panel

## Testing

When testing the Dons feature:
- Test form validation with invalid inputs
- Test payment processing flow
- Test state management with Redux
- Test component rendering with various data states
- Test accessibility with keyboard and screen readers

## Performance Considerations

- Selectors are memoized for efficient state access
- Components use React.memo where appropriate
- useCallback is used to prevent unnecessary re-renders
- Service calls are optimized with proper error handling
- Pagination reduces large dataset rendering

## Internationalization (i18n)

The feature is ready for internationalization:
- All user-facing strings can be moved to i18n files
- Dates use locale-aware formatting
- Currency formatting respects locale settings

## Security Considerations

- Form inputs are validated both client and server-side
- Payment data is handled securely
- Sensitive data (payment methods) are masked
- Anonymous donation option protects privacy

---

For more information, see `DONS_IMPLEMENTATION_SUMMARY.md`
