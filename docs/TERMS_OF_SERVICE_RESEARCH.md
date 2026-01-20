# **Global Legal Architecture for AI SaaS: A Comprehensive Terms of Service Framework**

## **Executive Summary: The Geopolitics of AI Regulation**

The launch of a United Kingdom-based Software-as-a-Service (SaaS) platform utilizing artificial intelligence to generate and edit coloring pages represents a commercial venture situated at the precise epicenter of a global regulatory fracture. The legal landscape for generative AI is currently defined by a "tri-polar" divergence: the United Kingdom’s pro-innovation but safety-conscious post-Brexit framework, the European Union’s rigorous risk-based legislative architecture under the AI Act, and the United States’ litigation-heavy, copyright-skeptical environment. For a UK entity serving a global customer base, the Terms of Service (ToS) cannot function merely as a static contractual agreement. It must serve as a dynamic regulatory shield, a mechanism for intellectual property assignment, and a compliance artifact capable of withstanding scrutiny from the UK’s Competition and Markets Authority (CMA), the US Federal Trade Commission (FTC), and the EU’s network of AI regulators.

This report provides an exhaustive analysis of the legal requirements for such a platform. It moves beyond standard software licensing to dissect the specific, novel clauses necessitated by generative AI technologies. The analysis reveals that the core tension in your ToS will be the balancing of **Intellectual Property (IP) Rights**—where the UK offers a unique competitive advantage through the Copyright, Designs and Patents Act 1988—against the **Safety and Liability** obligations imposed by the Online Safety Act 2023 and the EU AI Act. Furthermore, the specific nature of the application—coloring pages—inherently attracts a "mixed audience" of adults and children, triggering a cascade of child safety laws including the UK’s Age-Appropriate Design Code (AADC) and the US Children’s Online Privacy Protection Act (COPPA).

The report is structured to guide the drafting of a ToS that is not only compliant but strategically advantageous. By leveraging the UK’s recognition of "computer-generated works," the platform can offer users a degree of IP certainty unavailable to US competitors. Simultaneously, by adhering to the strictures of the new Digital Markets, Competition and Consumers Act 2024 (DMCCA), the platform can future-proof its subscription revenue models against the coming crackdown on "subscription traps." This document details every legal area, clause, and strategic consideration required to operationalize this global AI SaaS platform.

## ---

**Chapter 1: The Intellectual Property Matrix**

The allocation of intellectual property rights regarding AI-generated outputs is the single most critical commercial term in any Generative AI SaaS contract. The value proposition of a coloring page generator relies heavily on whether the user can commercially exploit the images they create—for instance, by printing them into physical books or selling digital downloads. However, the legal status of these outputs varies wildly across jurisdictions. Your Terms of Service must navigate this fractured landscape by constructing a flexible ownership framework that maximizes user rights where possible while disclaiming liability where the law is unsettled.

### **1.1 The United Kingdom’s Strategic Advantage: Computer-Generated Works**

The United Kingdom stands as a global anomaly in copyright law, offering a distinct legislative pathway that your ToS should aggressively leverage. unlike the vast majority of jurisdictions that require a human author for copyright to subsist, the UK’s **Copyright, Designs and Patents Act 1988 (CDPA)** explicitly recognizes "computer-generated works."

Section 9(3) of the CDPA states that in the case of a literary, dramatic, musical, or artistic work which is computer-generated, "the author shall be taken to be the person by whom the arrangements necessary for the creation of the work are undertaken".1 This provision was originally drafted to cover early computational art and database generation, but it has found renewed and critical relevance in the age of generative AI. It creates a legal fiction of authorship where no human "pen-to-paper" creativity exists.

For a SaaS platform, this creates a pivotal drafting choice: **Who is the "arranger"?**

There are two potential claimants to the title of "arranger" under Section 9(3):

1. **The Developer (You):** You created the system, trained the model, and provided the infrastructure without which the work could not exist. An argument exists that the "arrangements" are primarily the algorithmic architecture.  
2. **The User (Customer):** The user provides the specific prompt (e.g., "A coloring page of a Victorian house in winter"), selects parameters (style, complexity), and iterates on the output.

**Strategic Clause Recommendation:** To drive user adoption and commercial utility, your ToS should explicitly define the User as the "arranger" for the purposes of Section 9(3) CDPA. By contractually agreeing that the user is the person undertaking the arrangements, you clarify the chain of title. The clause should state that, *as between the parties*, the Platform acknowledges the User is the author of the Output under UK law and assigns any potential residual rights to the User.

However, this assignment must be **conditional**. If a user generates illegal content—such as Child Sexual Abuse Material (CSAM) or terrorist propaganda—you do not want them to own valid copyright in that material, nor do you want to facilitate its protection. Therefore, the IP assignment clause must be linked to compliance with the Acceptable Use Policy (AUP). The transfer of title should legally vest only upon the user's lawful use of the service.

### **1.2 The United States: The Human Authorship Barrier**

In sharp contrast to the UK, the United States legal system presents a significant barrier to copyrightability for AI outputs. The US Copyright Office (USCO) and federal courts have firmly established that "human authorship" is a constitutional requirement for copyright protection. This position has been reinforced by recent high-profile decisions, such as *Thaler v. Perlmutter*, where the court rejected copyright for a work created entirely by an AI, and the *Zarya of the Dawn* registration decision, where the USCO cancelled copyright registration for AI-generated images in a comic book while preserving copyright for the human-written text.4

For your US users, this means that the "coloring pages" generated by your platform may essentially be **public domain** upon creation. If a user generates a dragon image, they likely cannot prevent a third party from copying it, because the USCO views the prompt as a "suggestion" to the machine rather than a creative control.

The "Thin Copyright" Nuance:  
There is a nuanced exception that your ToS should acknowledge. The USCO has indicated that while raw AI output is unprotected, a user may claim copyright in the selection, arrangement, and modification of the material. If your SaaS tool allows users to edit the coloring pages—for example, by erasing lines, combining multiple generated elements, or adding manual text—those human-directed modifications are copyrightable. The resulting work would enjoy a "thin" copyright protecting only the human additions, not the underlying AI generation.  
Drafting the Jurisdictional Disclaimer:  
To avoid liability for misrepresentation, your ToS cannot broadly promise "You own the copyright" to a global audience. Doing so could be deemed a deceptive trade practice in the US if the user finds their work is unprotectable. Instead, the ToS must include a specific jurisdictional disclaimer.

* *Narrative Wording:* "The Platform assigns to the Customer all right, title, and interest it may have in the Output. However, the Customer acknowledges that the availability, scope, and validity of intellectual property rights in AI-generated works vary significantly by jurisdiction. The Platform makes no representation or warranty regarding the copyrightability of the Output in the Customer’s specific domicile, particularly in jurisdictions that require human authorship for copyright protection."

### **1.3 The European Union: The "Intellectual Creation" Standard**

The situation in the European Union sits between the UK and US positions. The EU does not have a specific "computer-generated works" provision like the UK. Instead, the Court of Justice of the European Union (CJEU) has established in cases like *Infopaq* that copyright subsists only if a work acts as the author's "own intellectual creation," reflecting their free and creative choices.4

Academic consensus and emerging policy suggest that purely generative works where the user acts as a passive prompter do not meet this standard. However, the "coloring page" use case involves iterative refinement. A user might prompt, reject, re-prompt, and tweak settings. Your ToS should frame the user's interaction as a creative process. By documenting the tools available (editing, refining), the ToS creates a narrative that supports the user's claim to "intellectual creation" should they ever need to defend their rights in an EU court.

**Table 1: Comparative IP Frameworks for AI Output**

| Jurisdiction | Legal Basis | Copyright Status | ToS Strategy |
| :---- | :---- | :---- | :---- |
| **United Kingdom** | CDPA 1988, s.9(3) | **Protected.** "Computer-generated work" (50-year term). Author is the "arranger." | Explicitly designate the User as the "arranger" to facilitate rights transfer. |
| **United States** | Copyright Act; *Thaler* | **Public Domain (Mostly).** Requires human authorship. Prompts are insufficient. | Disclaim warranty of copyrightability. Highlight "editing" tools to support "thin" copyright claims. |
| **European Union** | *Infopaq* Standard | **Uncertain/Hybrid.** Requires "intellectual creation" and creative choice. | Assign rights in the *process* and any modifications to support user claims. |
| **China** | Beijing Internet Court (2023) | **Protected (Conditional).** Recognized copyright where user input/selection was significant. | Similar to UK; assign rights to encourage commercial adoption. |

### **1.4 Input Rights and the Platform License**

While the focus is often on the Output, the Input—the data the user feeds into the system—is equally critical. In a coloring page app, users might upload sketches, photos, or previous designs to be "style-transferred" into line art. The user retains ownership of these Inputs, but the Platform requires a license to operate.

This license must be drafted with precision. It is insufficient to merely ask for a "right to use." To function, a SaaS platform needs a license to **host, reproduce, modify, adapt, and display** the content.

* **Host and Reproduce:** Necessary to store the file on your servers (e.g., AWS or Azure).  
* **Modify and Adapt:** Necessary because the AI process inherently transforms the image (e.g., converting a photo to a line drawing).  
* **Display:** Necessary if the user wants to see the image on their screen or share it in a gallery.

The "Improvement" License:  
The most contentious part of this license is the right to use Inputs and Outputs to train and improve the AI models. This is discussed in depth in Chapter 4, but from an IP perspective, the ToS must clarify whether the license grant includes a right for the Platform to exploit the data for R\&D purposes. If you intend to use user data to fine-tune your coloring models (e.g., using user corrections to learn what a "better" coloring page looks like), this must be an explicit, separate grant within the IP section.8

## ---

**Chapter 2: The Regulatory Tsunami – Online Safety & AI Acts**

As a UK-based service provider facilitating the generation of content, your platform falls squarely under the purview of the **Online Safety Act 2023 (OSA)**. This piece of legislation fundamentally alters the liability landscape for internet services. Unlike the US Section 230 regime, which broadly immunizes platforms from liability for user content, the OSA imposes a proactive "duty of care" on providers to prevent harm.

### **2.1 Categorization under the Online Safety Act**

The OSA applies to "user-to-user services" and "search services." Your coloring page platform is likely a **user-to-user service** if it allows any form of sharing, or if users can see content generated by others (e.g., a community gallery). Even if the service is purely private (User generates \-\> User downloads), the regulatory perimeter is expanding to cover generative AI tools that can produce illegal content.10

The Act mandates that you conduct a **Risk Assessment** regarding illegal content and content harmful to children. This assessment must be "suitable and sufficient" and kept up to date. Your ToS serves as the primary mechanism for mitigating the risks identified in this assessment.

### **2.2 Mandatory Content Prohibitions (Acceptable Use Policy)**

To comply with the "illegal content" safety duties, your ToS must include a robust **Acceptable Use Policy (AUP)** that explicitly prohibits specific categories of harm relevant to generative AI. General bans on "illegal acts" are insufficient; the OSA requires specificity.

**Specific High-Risk Categories:**

1. **Child Sexual Abuse Material (CSAM):** The generation of photorealistic or cartoon images depicting minors in sexualized contexts is a top priority for Ofcom (the UK regulator). Even "fantasy" CSAM generated by AI is illegal. The ToS must strictly prohibit any prompts intended to generate such material.14  
2. **Non-Consensual Intimate Imagery (NCII):** The UK has recently tightened laws regarding "deepfakes" and "nudification" apps. Under the OSA and the Criminal Justice Bill, the creation of sexually explicit deepfakes without consent is a criminal offense. Your AUP must explicitly ban the use of the tool to "undress" images of real people or generate sexualized likenesses of non-consenting individuals.17  
3. **Terrorist Content:** The generation of propaganda or material glorifying terrorism.

The "Duty to Prevent":  
The OSA requires "proportionate measures" to prevent users from encountering this content. In your ToS, you must reserve the right to monitor and filter prompts and outputs.

* *Drafting Insight:* "We reserve the right to employ automated content moderation systems, including keyword filtering and image analysis, to detect and block violations of our Acceptable Use Policy. We may report any illegal content detected on our platform to relevant law enforcement authorities, including the National Crime Agency (NCA) and the National Center for Missing & Exploited Children (NCMEC), without prior notice to you.".13

### **2.3 The EU AI Act: Transparency and Disclosure**

Serving a global audience brings you under the extraterritorial scope of the **EU AI Act**. As a provider of a "General Purpose AI" (GPAI) system that generates synthetic content, you face specific transparency obligations under **Article 50**.21

Article 50(2) \- The Watermarking Mandate:  
The EU AI Act requires that providers of AI systems generating synthetic audio, image, video, or text must ensure the output is "marked in a machine-readable format and detectable as artificially generated." This is not optional. It is a legal requirement designed to combat disinformation and deepfakes.

* **ToS Implication:** Your Terms must legally mandate the retention of these watermarks. You should include a clause prohibiting the removal of metadata.  
* *Clause Text:* "The Service automatically embeds metadata and/or visible watermarks (e.g., C2PA / CAI credentials) indicating that the Output is generated by artificial intelligence. You agree not to use any software or method to remove, obscure, alter, or strip these provenance indicators. Any attempt to disguise the AI origin of the content is a material breach of this Agreement.".24

Article 50(1) \- The "Chatbot" Disclosure:  
If your coloring tool uses a conversational interface (e.g., a chatbot that helps users refine their prompts), the AI Act requires that users be informed they are interacting with a machine. While this is primarily a UI/UX requirement, it should be reinforced in the ToS.

* *Clause Text:* "You acknowledge that the support agents, design assistants, and conversational interfaces within the Service may be Artificial Intelligence systems and not human operators."

### **2.4 The Digital Services Act (DSA)**

For users in the EU, the **Digital Services Act (DSA)** imposes further obligations on how you handle content moderation. If you suspend a user for violating the AUP (e.g., for trying to generate NSFW coloring pages), the DSA requires you to provide a "Statement of Reasons."

* **ToS Implication:** Your termination clause must accommodate this. "If we restrict or suspend your access to the Service, we will provide you with a statement of reasons for our decision, referencing the specific provision of the Terms of Service that was violated, and information on how you can appeal the decision through our internal complaint-handling system.".17

## ---

**Chapter 3: The Subscription Economy & DMCCA Compliance**

The **Digital Markets, Competition and Consumers Act 2024 (DMCCA)** represents a paradigm shift in how subscription contracts are regulated in the UK. Aimed at eliminating "subscription traps," these rules are significantly stricter than US regulations and carry the threat of direct enforcement by the CMA, with fines of up to 10% of global turnover. Your ToS must be drafted to anticipate these rules, which are set to come into full force in Spring 2026 but serve as the current best-practice benchmark.25

### **3.1 The "Renewal Reminder" Requirement**

Under the DMCCA, it is no longer sufficient to simply auto-renew a subscription based on silence. The Act mandates that traders send **Reminder Notices** for renewal payments. The timing and content are prescriptive.

* **Frequency:** You must send a reminder notice for any renewal that extends the contract for 6 months or more (e.g., an annual plan). You must also send a reminder when a free trial or introductory offer converts to a full-price subscription.  
* **ToS Integration:** Your billing terms must explicitly reference this communication channel. "We will send you a renewal reminder notice via email \[X\] days before your subscription is scheduled to auto-renew. This notice will state the renewal price, the date of the charge, and provide direct instructions on how to cancel.".29

### **3.2 The "Double" Cooling-Off Period**

Perhaps the most aggressive change in the DMCCA is the expansion of the "Cooling-Off Period." Under existing Consumer Contracts Regulations, users have a 14-day right to cancel and receive a full refund at the start of a contract. The DMCCA extends this right to **renewals**.

* **The Mechanism:** A consumer has a statutory right to cancel a subscription within 14 days of (i) the initial sign-up, (ii) the end of a free trial, and (iii) **any renewal that commits them to another 12 months** (or similar long term).  
* **ToS Drafting:** The standard US-style "All Fees Are Non-Refundable" clause is now **illegal** and unenforceable in the UK for these specific windows.  
* *Compliant Clause:* "You have a statutory right to cancel your subscription and receive a full refund within 14 days of: (a) the date you first signed up; (b) the date a free trial converts to a paid subscription; and (c) the date of any annual renewal payment. To exercise this right, you must notify us via \[Link/Email\]. We will process your refund within 14 days of your notice.".25

### **3.3 "Easy Exit" and Click-to-Cancel**

The DMCCA (and mirrored by the US FTC’s "Click to Cancel" proposed rule and California’s Auto-Renewal Law) mandates that cancelling a subscription must be as easy as signing up. If a user joined online, they must be able to cancel online—forcing them to call a phone number or chat with a retention agent is prohibited.

* **ToS Clause:** "You may cancel your subscription at any time via the 'Billing' tab in your account settings. Cancellation will take effect at the end of the current billing period, subject to your statutory cooling-off rights. We do not charge cancellation fees.".26

### **3.4 Global Variations: US Auto-Renewal Laws**

While the DMCCA is the gold standard for strictness, the US has its own patchwork. **California’s Automatic Renewal Law (ARL)** and the federal **Restore Online Shoppers' Confidence Act (ROSCA)** require "clear and conspicuous" disclosure of terms *before* obtaining billing information.

* **Integration:** Your ToS should include a "US State Law Addendum" or integrated clause that satisfies California’s requirement for an "immediate" cancellation link and affirmative consent (checkbox) for the renewal terms.

## ---

**Chapter 4: Data Privacy, Training, & The Value of Content**

The intersection of the **UK Data Protection Act 2018 (UK GDPR)**, the **EU GDPR**, and commercial AI strategy creates a complex challenge regarding the use of user data. A coloring page app generates a valuable dataset: millions of images, prompt-response pairs, and user edits that can teach a model how to create better closed lines for coloring. The legal question is: **Can you use this data to train your AI?**

### **4.1 The "Legitimate Interest" vs. "Consent" Battle**

Under the GDPR, processing personal data requires a lawful basis. While coloring pages might seem impersonal, prompts often contain personal data (e.g., "Draw my daughter Sophia").

**The Regulatory Split:**

* **The UK Position (ICO):** The Information Commissioner's Office has indicated that **"Legitimate Interests" (Article 6(1)(f))** *can* be a valid lawful basis for training generative AI, provided the developer conducts a rigorous Legitimate Interest Assessment (LIA). This assessment must balance the company’s interest in improving the model against the user's rights. Crucially, this basis requires offering a **Right to Object (Opt-Out)**.34  
* **The EU Position (EDPB):** The European Data Protection Board is more skeptical. In recent opinions and actions (e.g., against X/Twitter), EU regulators have suggested that if a model "absorbs" data such that it cannot be forgotten, or if the processing is vast, **Consent (Opt-In)** may be the only viable basis. They heavily scrutinize whether "Legitimate Interest" is sufficient for the intrusive act of scraping or training.36

### **4.2 ToS Drafting Strategy: The "Data Use" License**

Your ToS must establish a contractual license for data use that aligns with these privacy realities. You need a tiered approach to satisfy both commercial needs and regulatory pressure.

The "Improvement License" Clause:  
"By submitting Content (Inputs) and generating Output, you grant the Platform a non-exclusive, worldwide, royalty-free license to use, reproduce, and modify such Content for the purposes of operating and providing the Service."  
The Training Sub-Clause (The "Soft" Opt-Out):  
"You acknowledge that we may use Content that is not marked as 'Private' or 'Enterprise' to analyze usage patterns and improve our artificial intelligence models. This processing is based on our legitimate interest in developing better creative tools. You may opt-out of having your Content used for AI training at any time via your Account Settings. If you opt-out, your data will be excluded from future training runs."  
This clause attempts to walk the line: it relies on Legitimate Interest (UK friendly) but offers the Opt-Out required to defend that position.

### **4.3 Enterprise Data Segregation**

For B2B customers, the risk of data leakage (e.g., a competitor's confidential design appearing in the public model) is a dealbreaker. The ToS must explicitly segregate Enterprise data.

* **Clause:** "Notwithstanding the foregoing, Content associated with Enterprise Accounts is contractually excluded from our general-purpose model training datasets. We will not use Enterprise Content to improve our foundation models available to other customers.".8

### **4.4 Automated Decision Making (Article 22\)**

If your platform uses AI to automatically moderate content and ban users (e.g., a hash-matching algorithm banning a user for uploading a suspected prohibited image), this constitutes **Automated Decision Making (ADM)** under Article 22 of the UK GDPR.

* **ToS Requirement:** You must inform users of this processing and provide a mechanism for human review.  
* *Clause:* "We use automated systems to detect violations of our AUP. If your account is suspended by an automated system, you have the right to request a human review of the decision by contacting."

## ---

**Chapter 5: Child Safety & The "Mixed Audience" Trap**

The "coloring page" use case is deceptively risky. While it can be marketed to adults for "mindfulness," it is inherently attractive to children. This brings the platform into the scope of the **Age-Appropriate Design Code (AADC)** in the UK and **COPPA** in the US.

### **5.1 The "Mixed Audience" Definition**

Under COPPA, a website is "directed to children" if its subject matter, visual content, or characters appeal to kids. A "mixed audience" site is one that appeals to both. The legal requirement for mixed audience sites is strict: you cannot just assume users are adults. You must either (a) Age-Gate everyone, or (b) Treat everyone as a child until they prove they are an adult.39

### **5.2 The Age-Appropriate Design Code (Children's Code)**

The UK's AADC requires that services likely to be accessed by children must offer high privacy defaults. This impacts the ToS and the product design:

* **Data Minimization:** You cannot collect more data than necessary.  
* **No Nudging:** You cannot use design tricks to encourage children to weaken their privacy settings.  
* **Default Private:** User profiles and galleries must be private by default.

ToS Age Screening Clause:  
"This Service is intended for a general audience and is not directed at children under the age of 13\. By creating an account, you represent that you are at least 13 years of age. If you are under 18, you represent that you have the permission of a parent or guardian to use the Service. We reserve the right to request age verification and to terminate accounts that do not meet these criteria."  
Parental Responsibility:  
"If you are a parent or guardian permitting a minor to use your account, you agree to: (i) supervise their use of the Service; (ii) assume all risks associated with their use of the Service, including the transmission of content to and from third parties; and (iii) assume full liability for any legal consequences resulting from their use.".41

## ---

**Chapter 6: Liability, Indemnity, & Dispute Resolution**

The unpredictable nature of generative AI—"hallucinations"—creates a unique liability profile. A user might prompt for "a cute mouse" and get an image that infringes on Disney's Mickey Mouse copyright. Or the AI might generate offensive text in a caption. Who is responsible?

### **6.1 The "As-Is" Disclaimer & Hallucination Risk**

Standard software warranties (e.g., "the software will perform substantially in accordance with documentation") are dangerous for AI. You cannot guarantee the output.

* **Clause:** "The Service utilizes probabilistic artificial intelligence algorithms. You acknowledge that the Service may produce Output that is inaccurate, offensive, infringing, or otherwise not suitable for your intended purpose ('Hallucinations'). The Service and all Output are provided 'AS IS' and 'AS AVAILABLE' without warranty of any kind. We explicitly disclaim any warranty of non-infringement or fitness for a particular purpose.".42

### **6.2 The Indemnity Gap: Microsoft vs. Midjourney Models**

There is a market split in how AI companies handle indemnity.

* **The Enterprise Shield (Microsoft/Adobe):** These giants indemnify users against IP claims, *provided* the user used the platform's safety filters. This is a powerful sales tool but carries immense financial risk.44  
* **The User-Pays Model (Midjourney/Stability AI):** The platform disclaims all liability and requires the user to indemnify the platform.

Recommendation for a Startup:  
You likely cannot afford the "Enterprise Shield" risk. You should adopt a "User-Pays" model for the AI Output, while maintaining standard indemnity for the SaaS platform code itself.

* **Indemnification by User:** "You agree to indemnify, defend, and hold harmless \[Company\] from any claims, damages, liabilities, and expenses arising out of: (a) your violation of these Terms; (b) any Input you provide; and (c) your use, reproduction, or distribution of any Output, including any claim that the Output infringes the intellectual property rights of a third party.".45

### **6.3 Dispute Resolution and Class Action Waiver**

To mitigate litigation risk, particularly from US users, your ToS should include a mandatory arbitration clause and class action waiver.

* **Clause:** "To the fullest extent permitted by law, you and \[Company\] agree that any dispute arising out of or relating to these Terms or the Service will be resolved by binding arbitration, rather than in court. You explicitly waive any right to participate in a class action lawsuit or class-wide arbitration." (Note: This is generally unenforceable in the UK/EU for consumers, so the clause must include a "severability" provision protecting its validity in the US).48

### **6.4 Governing Law and the "Consumer Protection" Exception**

You will likely want **English Law** to govern the contract. However, under the **Rome I Regulation** (retained in UK law) and global consumer protection principles, you cannot deprive a consumer of the mandatory protections of their home country (e.g., a French consumer's right to warranty).

* Drafting the Clause:  
  "Governing Law: These Terms are governed by the laws of England and Wales.  
  Jurisdiction: The courts of England and Wales have exclusive jurisdiction.  
  Consumer Exception: If you are a consumer, you may also bring proceedings in the courts of the country in which you are resident. Nothing in these terms affects your statutory rights as a consumer to rely on mandatory provisions of your local law (e.g., the Consumer Rights Act 2015 in the UK).".50

## ---

**Chapter 7: Operationalizing the Terms of Service**

A ToS is useless if it is not enforceable. The method of acceptance is as important as the content.

### **7.1 Clickwrap vs. Browsewrap**

Courts (especially in the US) routinely strike down "Browsewrap" agreements (where a link sits in the footer). You must implement **"Clickwrap"**.

* **Mechanism:** During the sign-up flow, the user must tick a box stating "I agree to the Terms of Service and Privacy Policy" or click a button explicitly labeled "Agree and Sign Up." The link to the ToS must be immediately adjacent to the checkbox.

### **7.2 Managing Updates**

As AI regulations are volatile (e.g., the EU AI Act is still rolling out), you will need to update the ToS frequently.

* **Notification Clause:** "We may update these Terms from time to time. If we make material changes, we will notify you by email or by means of a notice within the Service prior to the change becoming effective. Your continued use of the Service after the effective date constitutes your acceptance of the new Terms."

## ---

**Conclusion and Strategic Outlook**

The legal framework for an AI-powered coloring page SaaS is a complex hybrid. It must fuse the **commercial aggression** of a US tech contract (to limit liability), the **consumer protection** of the new UK DMCCA (to prevent subscription fines), and the **safety architecture** of the Online Safety Act (to avoid criminal liability for deepfakes).

By proactively adopting the **UK-first IP assignment strategy** detailed in Chapter 1, you turn a legal obscurity (the "computer-generated works" doctrine) into a competitive product feature: certainty of ownership. Simultaneously, by adhering to the strict **transparency and watermarking** rules of the EU AI Act, you future-proof the platform against the global trend toward explainable AI.

This ToS structure is not merely a compliance requirement; it is a strategic asset. It defines the "product" not just as software, but as a legally managed creative workflow that protects both the user and the platform in an era of regulatory upheaval.

### **Summary Checklist of Mandatory Clauses**

| Category | Clause Name | Purpose & Legal Basis |
| :---- | :---- | :---- |
| **Introductory** | **Age & Eligibility** | Restrict use to 13+/18+ to comply with AADC/COPPA. |
| **IP Rights** | **Output Assignment (UK)** | Leverage CDPA s9(3) to assign "arranger" rights to User. |
| **IP Rights** | **Global IP Disclaimer** | Disclaim copyright validity in US/Human-authorship jurisdictions. |
| **IP Rights** | **Input License** | Secure rights to host, modify, and display user uploads. |
| **Safety** | **Acceptable Use Policy** | Ban CSAM, NCII, Terrorist content (Online Safety Act). |
| **Safety** | **Moderation Rights** | Reserve right to use automated filtering (OSA/DSA). |
| **Transparency** | **Watermarking Mandate** | Prohibit removal of C2PA/AI metadata (EU AI Act Art 50). |
| **Billing** | **Renewal Reminders** | Mandate pre-renewal notices (DMCCA 2024). |
| **Billing** | **Cooling-Off Period** | 14-day refund right for renewals (DMCCA 2024). |
| **Privacy** | **Training Opt-Out** | "Legitimate Interest" basis for training with right to object (UK GDPR). |
| **Liability** | **Hallucination Disclaimer** | "As-Is" warranty for probabilistic AI errors. |
| **Liability** | **User Indemnity** | User pays for IP infringement claims caused by their Prompts/Outputs. |
| **General** | **Governing Law** | England & Wales (with Consumer Override). |
| **General** | **Class Action Waiver** | Protect against US mass litigation. |

#### **Works cited**

1. Protecting AI with IP: Comparing approaches taken in the US and UK \- Mayer Brown, accessed on January 20, 2026, [https://www.mayerbrown.com/en/insights/publications/2025/10/protecting-ai-with-ip-comparing-approaches-taken-in-the-us-and-uk](https://www.mayerbrown.com/en/insights/publications/2025/10/protecting-ai-with-ip-comparing-approaches-taken-in-the-us-and-uk)  
2. Ownership of AI-generated content in the UK \- A\&O Shearman, accessed on January 20, 2026, [https://www.aoshearman.com/en/insights/ownership-of-ai-generated-content-in-the-uk](https://www.aoshearman.com/en/insights/ownership-of-ai-generated-content-in-the-uk)  
3. Copyright \- Association of Corporate Counsel (ACC), accessed on January 20, 2026, [https://www.acc.com/sites/default/files/resources/upload/COP22%20E-edition.pdf](https://www.acc.com/sites/default/files/resources/upload/COP22%20E-edition.pdf)  
4. Copyright Ownership of Generative AI Outputs Varies Around the World \- Cooley, accessed on January 20, 2026, [https://www.cooley.com/news/insight/2024/2024-01-29-copyright-ownership-of-generative-ai-outputs-varies-around-the-world](https://www.cooley.com/news/insight/2024/2024-01-29-copyright-ownership-of-generative-ai-outputs-varies-around-the-world)  
5. Copyright and Artificial Intelligence, Part 3: Generative AI Training Pre-Publication Version, accessed on January 20, 2026, [https://www.copyright.gov/ai/Copyright-and-Artificial-Intelligence-Part-3-Generative-AI-Training-Report-Pre-Publication-Version.pdf](https://www.copyright.gov/ai/Copyright-and-Artificial-Intelligence-Part-3-Generative-AI-Training-Report-Pre-Publication-Version.pdf)  
6. Copyright Office Releases Part 2 of Artificial Intelligence Report, accessed on January 20, 2026, [https://www.copyright.gov/newsnet/2025/1060.html](https://www.copyright.gov/newsnet/2025/1060.html)  
7. AI, Authorship, and Copyright: A Comparison Between the United States and the European Union | International and Comparative Law Review, accessed on January 20, 2026, [https://international-and-comparative-law-review.law.miami.edu/ai-authorship-and-copyright-a-comparison-between-the-united-states-and-the-european-union/](https://international-and-comparative-law-review.law.miami.edu/ai-authorship-and-copyright-a-comparison-between-the-united-states-and-the-european-union/)  
8. AI SaaS Agreement | Practical Law \- Westlaw, accessed on January 20, 2026, [https://content.next.westlaw.com/practical-law/document/I2288554bc9ca11ee8921fbef1a541940/AI-SaaS-Agreement?viewType=FullText\&transitionType=Default\&contextData=(sc.Default)](https://content.next.westlaw.com/practical-law/document/I2288554bc9ca11ee8921fbef1a541940/AI-SaaS-Agreement?viewType=FullText&transitionType=Default&contextData=\(sc.Default\))  
9. Consent in Training AI. Should you have control over whether… | by Stephanie Kirmer | TDS Archive | Medium, accessed on January 20, 2026, [https://medium.com/data-science/consent-in-training-ai-75a377f32f65](https://medium.com/data-science/consent-in-training-ai-75a377f32f65)  
10. Online Safety Act: explainer \- GOV.UK, accessed on January 20, 2026, [https://www.gov.uk/government/publications/online-safety-act-explainer/online-safety-act-explainer](https://www.gov.uk/government/publications/online-safety-act-explainer/online-safety-act-explainer)  
11. The applicability of the Online Safety Act to generative AI: Ofcom's position and regulatory uncertainties \- Taylor Wessing, accessed on January 20, 2026, [https://www.taylorwessing.com/en/interface/2025/online-and-ai-generated-content/the-applicability-of-the-online-safety-act-to-generative-ai](https://www.taylorwessing.com/en/interface/2025/online-and-ai-generated-content/the-applicability-of-the-online-safety-act-to-generative-ai)  
12. Implementation of the Online Safety Act \- The House of Commons Library, accessed on January 20, 2026, [https://commonslibrary.parliament.uk/research-briefings/cdp-2025-0043/](https://commonslibrary.parliament.uk/research-briefings/cdp-2025-0043/)  
13. Overview of regulated services | Ofcom, accessed on January 20, 2026, [https://www.ofcom.org.uk/siteassets/resources/documents/online-safety/information-for-industry/illegal-harms/overview-of-regulated-services.pdf?v=387540](https://www.ofcom.org.uk/siteassets/resources/documents/online-safety/information-for-industry/illegal-harms/overview-of-regulated-services.pdf?v=387540)  
14. Ofcom Explains How the UK Online Safety Act Will Apply to Generative AI | Inside Privacy, accessed on January 20, 2026, [https://www.insideprivacy.com/artificial-intelligence/ofcom-explains-how-the-uk-online-safety-act-will-apply-to-generative-ai/](https://www.insideprivacy.com/artificial-intelligence/ofcom-explains-how-the-uk-online-safety-act-will-apply-to-generative-ai/)  
15. Generative AI Prohibited Use Policy, accessed on January 20, 2026, [https://policies.google.com/terms/generative-ai/use-policy](https://policies.google.com/terms/generative-ai/use-policy)  
16. Usage policies \- OpenAI, accessed on January 20, 2026, [https://openai.com/policies/usage-policies/](https://openai.com/policies/usage-policies/)  
17. “Grok’d”: Five emerging lessons on limiting abuse of AI image generation, accessed on January 20, 2026, [https://www.info-res.org/cir/articles/grokd-five-emerging-lessons-on-limiting-abuse-of-ai-image-generation/](https://www.info-res.org/cir/articles/grokd-five-emerging-lessons-on-limiting-abuse-of-ai-image-generation/)  
18. UK tightens laws on AI-generated sexual deepfakes. What organisations need to know, accessed on January 20, 2026, [https://vinciworks.com/blog/uk-tightens-laws-on-ai-generated-sexual-deepfakes-what-organisations-need-to-know/](https://vinciworks.com/blog/uk-tightens-laws-on-ai-generated-sexual-deepfakes-what-organisations-need-to-know/)  
19. Grok, generative AI and the UK Online Safety Act, accessed on January 20, 2026, [https://www.simmons-simmons.com/en/publications/cmkfjc1xl0030v4tklthq0jn3/grok-generative-ai-and-the-uk-online-safety-act](https://www.simmons-simmons.com/en/publications/cmkfjc1xl0030v4tklthq0jn3/grok-generative-ai-and-the-uk-online-safety-act)  
20. Online Safety Act: Chatbots and Gen AI | DLA Piper, accessed on January 20, 2026, [https://www.dlapiper.com/insights/blogs/mse-today/2024/online-safety-act-chatbots-and-gen-ai](https://www.dlapiper.com/insights/blogs/mse-today/2024/online-safety-act-chatbots-and-gen-ai)  
21. AI Act | Shaping Europe's digital future \- European Union, accessed on January 20, 2026, [https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai)  
22. accessed on January 20, 2026, [https://www.euaiact.com/key-issue/5\#:\~:text=The%20provider%20must%20ensure%20that,as%20artificially%20generated%20or%20manipulated.\&text=The%20deployer%20must%3A,protection%20laws%20(e.g.%2C%20GDPR)](https://www.euaiact.com/key-issue/5#:~:text=The%20provider%20must%20ensure%20that,as%20artificially%20generated%20or%20manipulated.&text=The%20deployer%20must%3A,protection%20laws%20\(e.g.%2C%20GDPR\))  
23. Article 50: Transparency Obligations for Providers and Deployers of Certain AI Systems | EU Artificial Intelligence Act, accessed on January 20, 2026, [https://artificialintelligenceact.eu/article/50/](https://artificialintelligenceact.eu/article/50/)  
24. AI Product Terms \- Canva, accessed on January 20, 2026, [https://www.canva.com/policies/ai-product-terms/](https://www.canva.com/policies/ai-product-terms/)  
25. Key Changes to Consumer Protection Laws and Subscription Contracts in the United Kingdom That You Need to Know \- K\&L Gates, accessed on January 20, 2026, [https://www.klgates.com/Key-Changes-to-Consumer-Protection-Laws-and-Subscription-Contracts-in-the-United-Kingdom-That-You-Need-to-Know-1-2-2025](https://www.klgates.com/Key-Changes-to-Consumer-Protection-Laws-and-Subscription-Contracts-in-the-United-Kingdom-That-You-Need-to-Know-1-2-2025)  
26. New measures unveiled to crack down on subscription traps \- GOV.UK, accessed on January 20, 2026, [https://www.gov.uk/government/news/new-measures-unveiled-to-crack-down-on-subscription-traps](https://www.gov.uk/government/news/new-measures-unveiled-to-crack-down-on-subscription-traps)  
27. New UK consumer protection rules for subscription contracts: UK Government consultation, accessed on January 20, 2026, [https://www.cliffordchance.com/insights/resources/blogs/antitrust-fdi-insights/2024/11/new-uk-consumer-protection-rules-for-subscription-contracts-uk-government-consultation.html](https://www.cliffordchance.com/insights/resources/blogs/antitrust-fdi-insights/2024/11/new-uk-consumer-protection-rules-for-subscription-contracts-uk-government-consultation.html)  
28. The UK's new subscription contracts regime: what, when and why? \- Travers Smith, accessed on January 20, 2026, [https://www.traverssmith.com/knowledge/knowledge-container/the-uks-new-subscription-contracts-regime-what-when-and-why/](https://www.traverssmith.com/knowledge/knowledge-container/the-uks-new-subscription-contracts-regime-what-when-and-why/)  
29. Section 258 \- Digital Markets, Competition and Consumers Act 2024, accessed on January 20, 2026, [https://www.legislation.gov.uk/ukpga/2024/13/section/258](https://www.legislation.gov.uk/ukpga/2024/13/section/258)  
30. UK Digital Markets, Competition and Consumers Act: Subscription and unfair commercial practice changes \- Reed Smith LLP, accessed on January 20, 2026, [https://www.reedsmith.com/articles/uk-digital-markets-competition-consumers-act-subscription-unfair-commercial/](https://www.reedsmith.com/articles/uk-digital-markets-competition-consumers-act-subscription-unfair-commercial/)  
31. UK Crackdown on Subscription Traps: Government Reveals New Proposals for Incoming Subscription Contracts Regime Under DMCC Act \- Cooley, accessed on January 20, 2026, [https://www.cooley.com/news/insight/2024/2024-12-09-uk-crackdown-on-subscription-traps-government-reveals-new-proposals-for-incoming-subscription-contracts-regime-under-dmcc-act](https://www.cooley.com/news/insight/2024/2024-12-09-uk-crackdown-on-subscription-traps-government-reveals-new-proposals-for-incoming-subscription-contracts-regime-under-dmcc-act)  
32. The UK's new requirements for subscription contracts with consumers – DMCC Bill Deep Dive Part 3 \- Hogan Lovells, accessed on January 20, 2026, [https://www.hoganlovells.com/en/publications/subscription-contracts-new-requirements-to-help-uk-consumers-avoid-unintended-payments](https://www.hoganlovells.com/en/publications/subscription-contracts-new-requirements-to-help-uk-consumers-avoid-unintended-payments)  
33. DMCC Act subscription contracts rules: What's the latest? \- TLT LLP, accessed on January 20, 2026, [https://www.tlt.com/insights-and-events/insight/dmcca-subscription-contracts-rules---whats-the-latest](https://www.tlt.com/insights-and-events/insight/dmcca-subscription-contracts-rules---whats-the-latest)  
34. How do we ensure lawfulness in AI? | ICO, accessed on January 20, 2026, [https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/artificial-intelligence/guidance-on-ai-and-data-protection/how-do-we-ensure-lawfulness-in-ai/](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/artificial-intelligence/guidance-on-ai-and-data-protection/how-do-we-ensure-lawfulness-in-ai/)  
35. ICO Updates Position on Web-Scraping for AI Development \- cyber/data/privacy insights, accessed on January 20, 2026, [https://cdp.cooley.com/ico-updates-position-on-web-scraping-for-ai-development/](https://cdp.cooley.com/ico-updates-position-on-web-scraping-for-ai-development/)  
36. European Regulators Provide Guidance on the Use of Personal Data in Artificial Intelligence, accessed on January 20, 2026, [https://www.paulweiss.com/insights/client-memos/european-regulators-provide-guidance-on-the-use-of-personal-data-in-artificial-intelligence](https://www.paulweiss.com/insights/client-memos/european-regulators-provide-guidance-on-the-use-of-personal-data-in-artificial-intelligence)  
37. Opinion 28/2024 on certain data protection aspects related to the processing of personal data in the context of AI models, accessed on January 20, 2026, [https://www.edpb.europa.eu/system/files/2024-12/edpb\_opinion\_202428\_ai-models\_en.pdf](https://www.edpb.europa.eu/system/files/2024-12/edpb_opinion_202428_ai-models_en.pdf)  
38. AI Clauses In Contracts: The Practical Guide For 2025 \- Tascon – Legal, accessed on January 20, 2026, [https://tasconlegal.com/ai-clauses-in-contracts-the-practical-guide-for-2025/](https://tasconlegal.com/ai-clauses-in-contracts-the-practical-guide-for-2025/)  
39. Children's Rights | Page 2 | State of California \- Department of Justice \- Office of the Attorney General, accessed on January 20, 2026, [https://oag.ca.gov/new-press-categories/childrens-rights?page=1](https://oag.ca.gov/new-press-categories/childrens-rights?page=1)  
40. This is an unedited transcript. The statements within may be inaccurate, incomplete, or misattributed to the speaker. \- Congress.gov, accessed on January 20, 2026, [https://www.congress.gov/118/meeting/house/115519/documents/HHRG-118-IF00-Transcript-20230323.pdf](https://www.congress.gov/118/meeting/house/115519/documents/HHRG-118-IF00-Transcript-20230323.pdf)  
41. COPPA 2.0 Impact: How Child Privacy Laws Affect Family Businesses \- Jasmine Directory, accessed on January 20, 2026, [https://www.jasminedirectory.com/blog/coppa-2-0-impact-how-child-privacy-laws-affect-family-businesses/](https://www.jasminedirectory.com/blog/coppa-2-0-impact-how-child-privacy-laws-affect-family-businesses/)  
42. AI generated content disclaimer \- Legal \- JLL, accessed on January 20, 2026, [https://www.jll.com/en-us/ai-content-disclaimer](https://www.jll.com/en-us/ai-content-disclaimer)  
43. AI Disclaimer Clause Samples \- Law Insider, accessed on January 20, 2026, [https://www.lawinsider.com/clause/ai-disclaimer](https://www.lawinsider.com/clause/ai-disclaimer)  
44. MidJourney, Warner Bros. and AI Indemnity \- Aragon Research, accessed on January 20, 2026, [https://aragonresearch.com/midjourney-warner-bros-and-ai-indemnity/](https://aragonresearch.com/midjourney-warner-bros-and-ai-indemnity/)  
45. AI Service Agreements in Health Care: Indemnification Clauses, Emerging Trends, and Future Risks | ArentFox Schiff, accessed on January 20, 2026, [https://www.afslaw.com/perspectives/health-care-counsel-blog/ai-service-agreements-health-care-indemnification-clauses](https://www.afslaw.com/perspectives/health-care-counsel-blog/ai-service-agreements-health-care-indemnification-clauses)  
46. Reviewing SaaS agreements in the age of AI | BCLP \- Bryan Cave Leighton Paisner, accessed on January 20, 2026, [https://www.bclplaw.com/en-US/events-insights-news/reviewing-saas-agreements-in-the-age-of-ai.html](https://www.bclplaw.com/en-US/events-insights-news/reviewing-saas-agreements-in-the-age-of-ai.html)  
47. Terms of Use \- OpenAI, accessed on January 20, 2026, [https://openai.com/policies/row-terms-of-use/](https://openai.com/policies/row-terms-of-use/)  
48. Examples of governing law and jurisdiction clauses in contracts \- Afterpattern, accessed on January 20, 2026, [https://afterpattern.com/clauses/governing-law-and-jurisdiction](https://afterpattern.com/clauses/governing-law-and-jurisdiction)  
49. Jurisdiction and choice of law clauses in international contracts \- Pinsent Masons, accessed on January 20, 2026, [https://www.pinsentmasons.com/out-law/guides/jurisdiction-and-choice-of-law-clauses-in-international-contracts](https://www.pinsentmasons.com/out-law/guides/jurisdiction-and-choice-of-law-clauses-in-international-contracts)  
50. Governing Law Clause in Terms & Conditions \- TermsFeed, accessed on January 20, 2026, [https://www.termsfeed.com/blog/governing-law-terms-conditions/](https://www.termsfeed.com/blog/governing-law-terms-conditions/)  
51. The enforceability of governing law clauses in cross-border B2C contracts, accessed on January 20, 2026, [https://www.twobirds.com/en/insights/2016/uk/the-enforceability-of-governing-law-clauses-in-cross-border-b2c-contracts](https://www.twobirds.com/en/insights/2016/uk/the-enforceability-of-governing-law-clauses-in-cross-border-b2c-contracts)