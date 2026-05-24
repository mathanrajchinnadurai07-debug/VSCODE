import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Support() {
  const [activeFaq, setActiveFaq] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    topic: '',
    message: ''
  });

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    alert('Thank you for your message! Our support team will get in touch with you shortly. 🌿');
    setFormData({ name: '', email: '', topic: '', message: '' });
  };

  const faqs = [
    {
      q: "How do I know the products are truly organic?",
      a: "All our products are certified by India Organic (NPOP) and FSSAI. We source directly from verified organic farms and inspect each batch before delivery."
    },
    {
      q: "What is your delivery time?",
      a: "Standard delivery takes 2-4 business days. Express delivery is available in select cities for ₹49. Orders above ₹499 receive free standard delivery."
    },
    {
      q: "What is your return policy?",
      a: "We offer a 7-day easy return policy for all fresh and packed products. If the quality is unsatisfactory, we will provide a full refund or replacement."
    },
    {
      q: "Do you accept cash on delivery?",
      a: "Yes! We accept Cash on Delivery (COD), UPI (Google Pay, PhonePe, Paytm), and Credit/Debit card payments via Razorpay."
    },
    {
      q: "Is there a minimum order value?",
      a: "There is no minimum order value. However, orders above ₹499 get free standard delivery, whereas orders below ₹499 incur a small ₹49 fee."
    }
  ];

  return (
    <>
      <Head>
        <title>Help & Support — Curfee Organic Market</title>
      </Head>

      <div className="topbar">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><i className="fas fa-phone-alt"></i> <span className="app-dynamic-helpline">+91 78457 44038</span></div>
          <div><Link href="/" style={{ color: 'inherit', fontWeight: 600 }}>Back to Store</Link></div>
        </div>
      </div>

      <div className="container section">
        <h1 className="section-title text-center" style={{ textAlign: 'center', marginTop: '20px', fontSize: '1.8rem', fontWeight: 700 }}>Help & Support</h1>
        <p className="section-subtitle text-center" style={{ textAlign: 'center', color: '#64748b', marginBottom: '40px' }}>We're here to help you with anything you need</p>
        
        <div className="support-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
          {/* Send Message Form */}
          <div style={{ background: '#fff', padding: '30px', borderRadius: '14px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fas fa-envelope" style={{ color: 'var(--primary)' }}></i> Send Us a Message
            </h2>
            <form id="contactForm" onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label>Your Name</label>
                <input 
                  type="text" 
                  name="name"
                  required 
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Full name" 
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  name="email"
                  required 
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@example.com" 
                />
              </div>
              <div className="form-group">
                <label>Subject</label>
                <select 
                  name="topic"
                  required 
                  value={formData.topic}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                >
                  <option value="">Select a topic</option>
                  <option>Order Issue</option>
                  <option>Product Quality</option>
                  <option>Delivery Problem</option>
                  <option>Refund Request</option>
                  <option>Account Issue</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea 
                  name="message"
                  rows="4" 
                  required 
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Describe your issue..."
                ></textarea>
              </div>
              <button type="submit" className="btn btn-primary btn-block">
                <i className="fas fa-paper-plane"></i> Send Message
              </button>
            </form>
          </div>

          {/* Contact Details & FAQs */}
          <div>
            <div style={{ background: '#fff', padding: '24px', borderRadius: '14px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: 700 }}>📞 Get in Touch</h3>
              <div style={{ display: 'grid', gap: '12px', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="btn-icon" style={{ width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: '#f0faf4', color: 'var(--primary)' }}><i className="fas fa-phone"></i></div>
                  <div><strong>Call Us</strong><br /><span style={{ color: '#64748b' }}>+91 99966 67778</span></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="btn-icon" style={{ width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: '#f0faf4', color: 'var(--primary)' }}><i className="fas fa-envelope"></i></div>
                  <div><strong>Email</strong><br /><span style={{ color: '#64748b' }}>curfee01@gmail.com</span></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="btn-icon" style={{ width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: '#f0faf4', color: 'var(--primary)' }}><i className="fas fa-clock"></i></div>
                  <div><strong>Hours</strong><br /><span style={{ color: '#64748b' }}>Mon-Sat: 8 AM - 8 PM</span></div>
                </div>
              </div>
            </div>

            <div style={{ background: '#fff', padding: '24px', borderRadius: '14px', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '1.1rem', fontWeight: 700 }}>❓ Frequently Asked Questions</h3>
              {faqs.map((faq, i) => (
                <div className="faq-item" key={i} style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                  <button 
                    className="faq-question" 
                    onClick={() => toggleFaq(i)}
                    style={{ 
                      width: '100%', 
                      background: 'none', 
                      border: 'none', 
                      textAlign: 'left', 
                      fontSize: '0.9rem', 
                      fontWeight: 600, 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      cursor: 'pointer',
                      padding: '8px 0',
                      color: 'var(--text)'
                    }}
                  >
                    {faq.q} 
                    <i className={`fas fa-chevron-${activeFaq === i ? 'up' : 'down'}`} style={{ fontSize: '0.75rem', color: '#64748b' }}></i>
                  </button>
                  {activeFaq === i && (
                    <div className="faq-answer" style={{ padding: '8px 0', fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div style={{ height: '70px' }}></div>
    </>
  );
}
