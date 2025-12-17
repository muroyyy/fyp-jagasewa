import React from 'react';
import { X, FileText, Shield } from 'lucide-react';

export default function TermsModal({ isOpen, onClose, type = 'terms' }) {
  if (!isOpen) return null;

  const content = type === 'terms' ? {
    title: 'Terms and Conditions',
    icon: FileText,
    sections: [
      {
        heading: '1. Acceptance of Terms',
        content: 'By accessing and using JagaSewa, you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.'
      },
      {
        heading: '2. Service Description',
        content: 'JagaSewa provides a cloud-based property management platform for landlords and tenants in Malaysia. Our services include rent tracking, maintenance request management, document storage, and communication tools.'
      },
      {
        heading: '3. User Accounts',
        content: 'You are responsible for maintaining the confidentiality of your account credentials. You agree to accept responsibility for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.'
      },
      {
        heading: '4. Landlord Responsibilities',
        content: 'Landlords must provide accurate property information, respond to tenant requests in a timely manner, and comply with all applicable Malaysian property laws and regulations. Landlords are responsible for verifying tenant information and maintaining valid business registration (SSM).'
      },
      {
        heading: '5. Tenant Responsibilities',
        content: 'Tenants must provide accurate personal information, make timely rent payments, report maintenance issues promptly, and comply with property rules and Malaysian tenancy laws.'
      },
      {
        heading: '6. Payment Terms',
        content: 'All payments processed through JagaSewa are subject to our payment processing terms. We support FPX, e-wallet, and card payments. Transaction fees may apply. Refunds are subject to our refund policy.'
      },
      {
        heading: '7. Data Usage',
        content: 'We collect and process data necessary to provide our services. All data is stored securely on AWS cloud infrastructure. We do not sell your personal information to third parties.'
      },
      {
        heading: '8. Prohibited Activities',
        content: 'Users must not: (a) violate any laws or regulations, (b) infringe on intellectual property rights, (c) transmit malicious code, (d) attempt unauthorized access, (e) harass other users, or (f) use the service for fraudulent purposes.'
      },
      {
        heading: '9. Service Availability',
        content: 'While we strive for 99.9% uptime, we do not guarantee uninterrupted service. We reserve the right to modify, suspend, or discontinue services with reasonable notice.'
      },
      {
        heading: '10. Limitation of Liability',
        content: 'JagaSewa is provided "as is" without warranties. We are not liable for indirect, incidental, or consequential damages arising from use of our services. Our total liability is limited to the amount paid for services in the past 12 months.'
      },
      {
        heading: '11. Termination',
        content: 'We reserve the right to terminate or suspend accounts that violate these terms. Users may cancel their accounts at any time through account settings.'
      },
      {
        heading: '12. Governing Law',
        content: 'These terms are governed by the laws of Malaysia. Any disputes shall be resolved in Malaysian courts.'
      },
      {
        heading: '13. Changes to Terms',
        content: 'We may update these terms from time to time. Continued use of JagaSewa after changes constitutes acceptance of the new terms.'
      },
      {
        heading: '14. Contact Information',
        content: 'For questions about these terms, contact us at support@jagasewa.com'
      }
    ]
  } : {
    title: 'Privacy Policy',
    icon: Shield,
    sections: [
      {
        heading: '1. Information We Collect',
        content: 'We collect information you provide directly (name, email, phone, address, IC number), automatically (IP address, device info, usage data), and from third parties (payment processors, SSM verification).'
      },
      {
        heading: '2. How We Use Your Information',
        content: 'We use your information to: provide and improve our services, process payments, verify identity, send notifications, respond to support requests, comply with legal obligations, and prevent fraud.'
      },
      {
        heading: '3. Data Storage and Security',
        content: 'All data is stored on AWS cloud infrastructure in Singapore region. We implement industry-standard security measures including encryption, access controls, and regular security audits. However, no system is 100% secure.'
      },
      {
        heading: '4. Information Sharing',
        content: 'We share information with: landlords and tenants (as necessary for property management), service providers (AWS, payment processors), law enforcement (when legally required). We do not sell your personal information.'
      },
      {
        heading: '5. IC Verification',
        content: 'For tenant verification, we use AWS Rekognition to verify Malaysian IC cards. IC images are processed securely and stored encrypted. This is optional but recommended for landlord protection.'
      },
      {
        heading: '6. Payment Information',
        content: 'Payment card details are processed by certified payment gateways. We do not store full card numbers. We retain transaction records for accounting and dispute resolution.'
      },
      {
        heading: '7. Cookies and Tracking',
        content: 'We use session cookies for authentication and analytics cookies to improve our service. You can disable cookies in your browser, but this may affect functionality.'
      },
      {
        heading: '8. Your Rights',
        content: 'You have the right to: access your personal data, correct inaccurate data, request data deletion, export your data, withdraw consent, and lodge complaints with Malaysian authorities (PDPA).'
      },
      {
        heading: '9. Data Retention',
        content: 'We retain your data for as long as your account is active, plus 7 years for financial records (Malaysian tax law requirement). You can request earlier deletion subject to legal obligations.'
      },
      {
        heading: '10. Children\'s Privacy',
        content: 'JagaSewa is not intended for users under 18. We do not knowingly collect information from children. If we discover such data, we will delete it promptly.'
      },
      {
        heading: '11. International Transfers',
        content: 'Your data is stored in AWS Singapore region. By using JagaSewa, you consent to this transfer and storage.'
      },
      {
        heading: '12. Third-Party Links',
        content: 'Our service may contain links to third-party websites. We are not responsible for their privacy practices. Please review their policies separately.'
      },
      {
        heading: '13. Changes to Privacy Policy',
        content: 'We may update this policy from time to time. We will notify you of significant changes via email or platform notification.'
      },
      {
        heading: '14. Contact Us',
        content: 'For privacy concerns or data requests, contact us at: support@jagasewa.com or write to: JagaSewa, Kuala Lumpur, Malaysia'
      },
      {
        heading: '15. PDPA Compliance',
        content: 'JagaSewa complies with Malaysia\'s Personal Data Protection Act 2010 (PDPA). We are committed to protecting your personal data in accordance with Malaysian law.'
      }
    ]
  };

  const Icon = content.icon;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Icon className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{content.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Last Updated:</strong> January 2025
              </p>
              <p className="text-sm text-blue-700 mt-2">
                Please read these {type === 'terms' ? 'terms' : 'policies'} carefully before using JagaSewa.
              </p>
            </div>

            {content.sections.map((section, idx) => (
              <div key={idx} className="space-y-2">
                <h3 className="text-lg font-bold text-gray-900">{section.heading}</h3>
                <p className="text-gray-700 leading-relaxed">{section.content}</p>
              </div>
            ))}

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-8">
              <p className="text-sm text-gray-600">
                By using JagaSewa, you acknowledge that you have read, understood, and agree to be bound by these {type === 'terms' ? 'Terms and Conditions' : 'Privacy Policy'}.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all cursor-pointer"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
