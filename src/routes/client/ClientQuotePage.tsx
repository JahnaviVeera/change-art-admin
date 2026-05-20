import { useNavigate } from 'react-router-dom';
import { ClientBriefForm, GreetingHero } from '@modules/shared-ui';

export function ClientQuotePage() {
  const navigate = useNavigate();
  return (
    <div className="page">
      {/* <GreetingHero
        title="Request a Quote"
        subtitle="Tell us what you need. We'll review the brief, set pricing, and send it back for your approval."
      /> */}
      <ClientBriefForm
        mode="quote"
        onSubmit={(id) => {
          console.info(`Quote ${id} submitted`);
          navigate('/client/jobs');
        }}
      />
    </div>
  );
}
