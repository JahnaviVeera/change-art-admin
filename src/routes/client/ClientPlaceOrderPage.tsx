import { useNavigate } from 'react-router-dom';
import { ClientBriefForm, GreetingHero } from '@modules/shared-ui';

export function ClientPlaceOrderPage() {
  const navigate = useNavigate();
  return (
    <div className="page">
      {/* <GreetingHero
        title="Place an Order"
        subtitle="Skip the quote step — confirm the brief, agree to the published rate, and we'll start production immediately."
      /> */}
      <ClientBriefForm
        mode="order"
        onSubmit={(id) => {
          console.info(`Order ${id} placed`);
          navigate('/client/jobs');
        }}
      />
    </div>
  );
}
