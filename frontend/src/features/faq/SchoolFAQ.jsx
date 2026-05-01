import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search, HelpCircle, ShoppingBag, Truck, XCircle, RefreshCw, CreditCard, MessageCircle } from 'lucide-react';

const FAQItem = ({ question, answer, isOpen, onClick }) => (
  <div className="border-b border-gray-100 last:border-0">
    <button
      onClick={onClick}
      className="w-full py-6 flex items-center justify-between gap-4 text-left group transition-all"
    >
      <span className={`text-lg font-medium transition-colors ${isOpen ? 'text-primary' : 'text-text-primary group-hover:text-primary'}`}>
        {question}
      </span>
      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${isOpen ? 'bg-primary text-white rotate-180' : 'bg-gray-50 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary'}`}>
        <ChevronDown size={18} />
      </div>
    </button>
    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] pb-8 opacity-100' : 'max-h-0 opacity-0'}`}>
      <div className="text-text-secondary leading-relaxed whitespace-pre-line pr-12 font-normal">
        {answer}
      </div>
    </div>
  </div>
);

const FAQSection = ({ title, icon: Icon, items, openIndex, onToggle }) => (
  <div className="mb-12 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="bg-gray-50/50 px-8 py-6 border-b border-gray-100 flex items-center gap-4">
      <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary">
        <Icon size={20} />
      </div>
      <h2 className="text-xl font-bold text-deep-purple">{title}</h2>
    </div>
    <div className="px-8">
      {items.map((item, index) => (
        <FAQItem
          key={index}
          {...item}
          isOpen={openIndex === index}
          onClick={() => onToggle(index)}
        />
      ))}
    </div>
  </div>
);

const SchoolFAQ = () => {
  const [activeSections, setActiveSections] = useState({
    orders: 0,
    shipping: -1,
    cancellation: -1,
    return: -1,
    payments: -1
  });

  const toggleSection = (section, index) => {
    setActiveSections(prev => ({
      ...prev,
      [section]: prev[section] === index ? -1 : index
    }));
  };

  const faqData = {
    orders: [
      {
        question: "How to check the status of my order?",
        answer: "Login to schoolEmart.com with your login credentials and click on My Orders tab to check the order details. If your order has been shipped by the seller, you can click on the \"Track\" tab to track your order."
      },
      {
        question: "How long it will take the order to deliver once it is placed?",
        answer: "Once the order is placed, you will get the confirmation about the order placement with the promised delivery date. The promise delivery date varies by products and by sellers."
      }
    ],
    shipping: [
      {
        question: "What is schoolEmart.com shipping policy?",
        answer: "schoolEmart.com strives to get the item(s) delivered by its seller(s) in excellent condition and in fastest time possible. There is no extra charge applicable by schoolEmart.com for getting the item(s) delivered to the customers.\n\nHowever, the shipping charges can be applicable on some products and/or for some pin codes by the seller. You can go to the Product details page to check the shipping charges & estimated delivery time for the specific item(s)."
      },
      {
        question: "How to check if schoolEmart.com delivers to my pincode?",
        answer: "To check the pincode serviceability, go to https://www.schoolEmart.com and select the product of you choice. On the right side of product details page, you can enter the pincode of you locality and click on \"verify\" to check the pincode serviceability."
      },
      {
        question: "Will I get a call before delivery is attempted?",
        answer: "Yes, you will be getting a call on the registered number by our seller at the time of delivery."
      },
      {
        question: "Which courier company will deliver my order? Can I choose my preferred courier company?",
        answer: "Currently, the deliveries are done by the sellers and the courier providers are chosen by the seller for the fastest deliveries. As of now, customers cannot select any courier service for deliveries."
      },
      {
        question: "The delivery time committed for my order is over now. What do I do?",
        answer: "We try our best to have your order delivered to you on or before the promise date. However, there are very rare chances when the delivery gets delayed. For every order which is delayed, our team contacts the seller and tries to expedite the delivery proactively.\n\nYou may also reach out to us for the latest update on your order incase we have already not gotten in touch with you. During this period, you can also cancel the order and request for the complete refund to the source account."
      },
      {
        question: "Can I expect delivery on all days of the week?",
        answer: "Yes, delivery date will be generated depending on the products you have ordered. Hence, the delivery dates can be any day during the week."
      },
      {
        question: "How to avail Next Day Delivery on product?",
        answer: "Sorry, currently we do not have this option. However, we try our best to have your orders delivered to you at the earliest."
      }
    ],
    cancellation: [
      {
        question: "What is schoolEmart.com cancellation policy?",
        answer: "schoolEmart.com ensures that your order is safely delivered to you within the promised delivery timeline. However, School may cancel their order until the item(s) is/are packed from the seller.\n\nAny amount paid against the said cancelled item(s) will be credited into the same source account using which the payment was made within 7-10 business days from the time the item(s) were cancelled.\n\nUnder some rare situations, schoolEmart.com or any of our sellers can also raise an order cancellation request. These situations could be:\n• Product Out of stock with the seller\n• Restrictions on the number of products you can order\n• Incorrect pricing or description of the product\n• Payment fraud suspicion\n• Incorrect or incomplete school's address\n\nIn case of order cancellation by schoolEmart.com or seller, the paid amount will be refunded to school, in accordance with our Payment policy. We will notify the school at their registered email address."
      },
      {
        question: "How do I cancel my order?",
        answer: "You can cancel your order by login into \"My Account\". Please note that the order can be cancelled only if the same is not \"packed\" by the seller. You can check the status of the order in \"My Account\" section."
      },
      {
        question: "I just cancelled my order, when will I receive the refund?",
        answer: "Once the order is cancelled, the amount should reflect into your source account within 7-10 business days from the day of cancellation. Incase, the above mentioned time period is over, you may reach out to us by login into \"My Account\" and click on \"Contact Admin\" and raise your query with us."
      },
      {
        question: "I am not able to cancel my order/replacement order",
        answer: "Once your order is confirmed and packed by the seller, you will not be able to cancel the order. However, if you do not require the product anymore, you may reach out to us to give us your cancellation request.\n\nPlease note, order cancellation request after the order is packed would attract a nominal charge which will be sum equal to the payment gateway charges, shipping charges (only if the order has left the seller's location/warehouse) & associated GST on the transaction."
      },
      {
        question: "What are the cancellation timelines?",
        answer: "You can cancel your order before it is packed by the seller without any charges. However, if you wish to cancel the order once the order is packed, there will be a charge applicable to you which will be the sum equal to the payment gateway charges, shipping charges & associated GST."
      },
      {
        question: "Can I modify the Shipping address after the order is placed?",
        answer: "No, you will not be able to change the shipping order once the order is placed."
      }
    ],
    return: [
      {
        question: "What is schoolEmart.com returns policy?",
        answer: "schoolEmart.com replacement & returns policy gives you an option to initiate Replacement or Return request for the item(s) purchased within 48 hours of receipt of the item(s). We only ask that you don't use the product and preserve its original condition, tags, and packaging.\n\nPlease note that replacement will happen hand to hand with the delivery person. School needs to generate a replacement request online and wait for the New Order to arrive.\n\nReasons for Replacement/Return:\n• Item received is defective / dead on arrival\n• Missing item(s) / component(s)\n• item(s) received does not match description"
      },
      {
        question: "How to create a return request?",
        answer: "In order to create a return request, you need to login to \"My Account\" and click on the Return tab for the respective order and select Returns from the drop down option. Please note that, Return Tab will be available only until 48 hours from the time of delivery."
      },
      {
        question: "I have created a return request, when will I get the refund?",
        answer: "Once the product is picked up from your location by the seller, within 24 hours the same will undergo for a quality check. Post successful quality check, the amount will be processed for the refund which will take 7-10 business days for the amount to reflect into the source account."
      },
      {
        question: "Can I create a return request for one item?",
        answer: "Yes, you can create a return request for one item."
      },
      {
        question: "How to create a replacement request?",
        answer: "In order to create a replacement request, you need to login to \"My Account\" and click on the Return tab for the respective order and select Replacement from the drop down option. Return Tab will be available only until 48 hours from delivery."
      },
      {
        question: "Will I be charged shipping for replacement products?",
        answer: "No, there will be no extra shipping charges for the replacement products if the product meets our replacement policy."
      }
    ],
    payments: [
      {
        question: "How can I pay for my order at schoolEmart.com?",
        answer: "You can use any of the online payment methods mentioned below:\n• Credit Card\n• Debit Card\n• Net Banking"
      },
      {
        question: "Why can't I see the Cash On Delivery (COD) on my payment page?",
        answer: "Currently, we do not have Cash On Delivery (COD) option available for any order."
      },
      {
        question: "What should I do if my payment fails?",
        answer: "Please make the payment after ensuring that the information entered is accurate, including all account details, billing addresses and passwords."
      },
      {
        question: "Amount has been debited, however I have not received the order number. What should I do?",
        answer: "If your payment is debited from account after a payment failure, it will be credited back within 7-10 days to the source account, after we receive a confirmation from the bank."
      },
      {
        question: "I am being charged GST on my order. What is GST?",
        answer: "GST is a single tax on the supply of goods and services that is levied on every value addition and is added to a product's sale price. GST has to be borne/paid by the ultimate consumer of the product or service."
      },
      {
        question: "If I return/cancel the purchased item, will the GST charges be refunded?",
        answer: "Yes. If you return the product as per our returns policy, the applicable GST amount will also be refunded into the source account."
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* 1. Hero / Header */}
      <section className="bg-primary pt-12 pb-24 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-orange/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>

        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full mb-6 border border-white/10">
            <HelpCircle size={16} className="text-accent-orange" />
            <span className="text-[11px] font-bold uppercase tracking-widest">Help Center</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">FAQs</h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto font-normal leading-relaxed">
            Everything you need to know about orders, shipping, and procurement on schoolEmart.
          </p>

          <div className="mt-12 relative max-w-xl mx-auto group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search for questions (e.g. tracking, refund, bulk orders)"
              className="w-full pl-14 pr-6 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* 2. FAQ Content */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <FAQSection
            title="Orders & Tracking"
            icon={ShoppingBag}
            items={faqData.orders}
            openIndex={activeSections.orders}
            onToggle={(i) => toggleSection('orders', i)}
          />
          <FAQSection
            title="Shipping & Delivery"
            icon={Truck}
            items={faqData.shipping}
            openIndex={activeSections.shipping}
            onToggle={(i) => toggleSection('shipping', i)}
          />
          <FAQSection
            title="Cancellations"
            icon={XCircle}
            items={faqData.cancellation}
            openIndex={activeSections.cancellation}
            onToggle={(i) => toggleSection('cancellation', i)}
          />
          <FAQSection
            title="Return & Replacement"
            icon={RefreshCw}
            items={faqData.return}
            openIndex={activeSections.return}
            onToggle={(i) => toggleSection('return', i)}
          />
          <FAQSection
            title="Payments & GST"
            icon={CreditCard}
            items={faqData.payments}
            openIndex={activeSections.payments}
            onToggle={(i) => toggleSection('payments', i)}
          />

          {/* 3. Support CTA */}
          <div className="mt-20 bg-deep-purple p-10 rounded-[2.5rem] text-center relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl group-hover:scale-110 transition-transform duration-700"></div>
            <div className="relative z-10">
              <h3 className="text-2xl font-bold text-white mb-4">Still have questions?</h3>
              <p className="text-white/60 mb-10 max-w-md mx-auto">
                Our procurement experts are here to help you with your institutional needs.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <button className="px-10 py-4 bg-accent-orange text-deep-purple font-bold rounded-2xl hover:bg-accent-gold transition-all flex items-center gap-3">
                  <MessageCircle size={20} /> Contact Support
                </button>
                <div className="text-white/80 font-medium">
                  Or email us at <a href="mailto:support@schoolEmart.com" className="text-white underline hover:text-accent-orange transition-colors">support@schoolEmart.com</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SchoolFAQ;
