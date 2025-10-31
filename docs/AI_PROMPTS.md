# AI Prompts & Guidelines

## Student Assistant (STUB)

**Note**: This is a STUB section. The actual AI chatbot is NOT implemented in this demo. Only the UI shell and escalation pathway are functional.

### Escalation Policy

The Student Assistant chat interface provides an "Escalate to Ticket" button that allows students to create a support ticket directly from the chat interface.

**When to Escalate (Conceptual Guidelines for Future Implementation)**:
- Student explicitly requests to speak to a human agent
- AI confidence score < 0.7 for 2+ consecutive responses
- Student expresses frustration or dissatisfaction
- Query requires accessing private student records (grades, financial data)
- Query involves policy exceptions or special circumstances
- Query requires actions beyond information retrieval (refunds, grade changes, etc.)

### Guardrails

**For future implementation, the chatbot should**:
- Never make promises about outcomes or timelines
- Never access or display PII without proper authentication
- Never provide legal, medical, or immigration advice
- Always cite source articles when providing information
- Always disclose when escalating to human agent
- Always provide alternative self-service options (KB articles, forms)

### Ticket Creation from Chat

**Handoff Rules**:

When a student clicks "Escalate to Ticket":
1. **Context Preservation**: Pre-fill ticket form with:
   - Summary of chat conversation
   - Student intent/question
   - Any information already collected
2. **Department Routing**: Pre-select department based on chat context
3. **Priority Assessment**: Set priority based on:
   - Keywords (urgent, emergency, deadline)
   - Student status (holds, blocks)
   - SLA rules
4. **Redaction Stubs**:
   - Mask any PII in conversation transcript
   - Flag sensitive information for agent review

**Confidence Gates**:
- High confidence (>0.8): Suggest KB articles first
- Medium confidence (0.5-0.8): Offer both KB and ticket creation
- Low confidence (<0.5): Recommend ticket creation immediately

**Example Escalation Flow**:
```
Student: "I need help with my payment plan"
Bot: [Displays KB article + payment plan form]
Student: "This doesn't answer my question"
Bot: [Confidence drops to 0.6]
Bot: "I can help you create a ticket to speak with a finance specialist. Would you like to do that?"
Student: [Clicks "Escalate to Ticket"]
System: Opens pre-filled ticket form with:
  - Department: Finance
  - Service: Tuition Payment Plan
  - Description: "Student inquiry about payment plan. Context: [chat summary]"
```

---

## Agent Composer Assistant (Placeholder for Part 3)

*This section will be expanded in Part 3: Staff Workspace*

---

## Knowledge Base Search & Citation (Placeholder for Part 5)

*This section will be expanded in Part 5: AI & Integration*

---

## Auto-Routing & Classification (Placeholder for Part 5)

*This section will be expanded in Part 5: AI & Integration*

---

## Quality & Tone Guidelines

### Student-Facing Communications
- **Tone**: Friendly, empathetic, professional
- **Language Level**: 8th-10th grade reading level
- **Structure**:
  - Start with acknowledgment
  - Provide clear answer with citations
  - Offer next steps
  - Ask if more help is needed

### Example (Good):
```
Hi Sarah! I understand you're asking about payment plan options.

Based on your balance of $2,400, you're eligible for our 3, 6, or 12-month payment plans. Here's how they work:

[Citation: Payment Plans Overview - /kb/payment-plans-overview]

To get started, you can fill out the payment plan request form here: [link]

Is there anything else I can help you with?
```

### Example (Bad):
```
Per university policy section 4.2.1, students with outstanding balances exceeding $1,000 may submit form FIN-PP-01 for installment payment consideration subject to approval.
```

---

## Multilingual Support

### Arabic Language Handling
- Use formal Arabic (Modern Standard Arabic, MSA)
- Right-to-left layout respected
- Numbers formatted in Arabic numerals when locale=ar
- Date formats: DD/MM/YYYY for Arabic locale

### Example Arabic Response:
```
مرحباً أحمد! أفهم أنك تسأل عن خيارات خطة الدفع.

بناءً على رصيدك البالغ ٢٤٠٠ دولار، أنت مؤهل لخطط الدفع لمدة ٣ أو ٦ أو ١٢ شهرًا.

[اقتباس: نظرة عامة على خطط الدفع]

للبدء، يمكنك ملء نموذج طلب خطة الدفع هنا: [رابط]

هل هناك أي شيء آخر يمكنني مساعدتك به؟
```

---

## Redaction & Privacy

### PII Detection Patterns (Stub)
- SSN: `\d{3}-\d{2}-\d{4}`
- Credit Card: `\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}`
- Phone: `\d{3}[\s.-]?\d{3}[\s.-]?\d{4}`
- Email: `[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`

### Redaction Example:
```
Original: "My SSN is 123-45-6789 and my card is 4111-1111-1111-1111"
Redacted: "My SSN is ***-**-**** and my card is ****-****-****-1111"
```

**Note**: In production, use proper tokenization and never log unredacted PII.

---

## Analytics & Feedback

### Metrics to Track (Conceptual)
- **Deflection Rate**: % of chats that don't escalate to ticket
- **Self-Solve Rate**: % of chats ending with "helpful" feedback
- **Citation Usage**: % of responses with KB citations
- **Escalation Reasons**: Category tags for why tickets are created
- **Average Chat Duration**: Time from first message to resolution/escalation
- **CSAT**: Post-chat satisfaction rating

### Feedback Collection
- After chat ends: "Was this helpful? Yes / No"
- If No: "What could we improve?" (free text, optional)
- If Yes: "Would you like to rate this conversation?" (1-5 stars, optional)

---

## Error Handling

### Fallback Responses
```
"I'm having trouble understanding that. Could you rephrase your question?"
"I don't have information on that topic. Would you like me to create a ticket for you?"
"I'm experiencing technical difficulties. Please try again or visit our help center."
```

### Service Degradation
If AI service is unavailable:
- Show error message: "Chat assistant is temporarily unavailable"
- Provide alternative actions:
  - Browse Knowledge Base
  - View Service Catalog
  - Create Ticket Directly

---

## Testing Scenarios (for future implementation)

### Happy Path
1. Student asks about tuition payment
2. Bot provides KB article citation
3. Student confirms helpful
4. Chat ends with CSAT prompt

### Escalation Path
1. Student asks complex question
2. Bot provides partial answer (low confidence)
3. Student says "I need more help"
4. Bot offers to create ticket
5. Student clicks "Escalate to Ticket"
6. Pre-filled form opens
7. Student submits ticket
8. Redirected to ticket status page

### Multilingual Path
1. Student switches language to Arabic
2. Bot detects locale change
3. Subsequent responses in Arabic
4. KB citations link to Arabic articles (if available)
5. Ticket form pre-filled in Arabic

### Error Handling Path
1. AI service timeout
2. Show fallback error message
3. Offer manual ticket creation
4. Log error for monitoring

---

**End of AI_PROMPTS.md (Part 2)**

*Sections for agent-facing AI features, auto-routing, and advanced prompts will be added in subsequent parts.*
