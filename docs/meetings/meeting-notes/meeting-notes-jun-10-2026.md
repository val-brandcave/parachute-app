# June 10, 2026

# Agenda

- Showcase to Ed, the progress of YouConnect Onboarding, CS Activity Log, template type field, Bid Panel template columns.

---

## General Feedback

- I know we just came from a meeting with Ledgerwise. But never come to a meeting unprepared. We wasted the first 7 minutes waiting for you to get to the right Vercel link. That’s unfortunate.
- [I have made the same comment multiple times. I’m saying it again. Inputs should have white backgrounds.](https://loom.com/i/709468a53a2342b4931a9cb8ece293cc)

## YouConnect Onboarding

- Ship the current project over to Ed with transition documentation

## Parachute Version 2.0

- Context
    - They launched a pilot program: fixed fee, unlimited. They’ve done 100 appraisals through it. All-in-all, it’s growing at a rapid pace. They want to add more flavor to the interface.
    - The app is housing for parachute within uconnect and also the standalone version for youconnect for outside customers
    - Nothing is final
    - Create a layer between orgs and reviewers
- Auth Screens
    - [Login](https://loom.com/i/5f87a5589a2b4cc390d30f1f629481e5)
- [Dashboard](https://loom.com/i/54f0c942971c4fe7a43e4515ab8946f4)
    - My Reviews List and metrics
- [Order a Review](https://loom.com/i/23abbfe99b0244928dcafb30e5aebdf4)
    - [Step 2](https://loom.com/i/9a89d71d983e42d8a67d69365f227ad9)
    - 
- [Technical Review](https://loom.com/i/63e54106460b4c9eb0163c2e3da0e23b)
    - This is more like review details
    - You can accept/reject reviewer findings as well as agree/disagree with Parachute findings.
    - They need to be able send the back review for updates - batched list of corrections can be sent
    - Big problem: missing context because you’re not seeing the comments within the appraisal document itself.
    - User Issue: they struggle to show this as their own work
        - Solution: users should be able to adjust the feedback
- [Workbook](https://loom.com/i/2b962cc8853b43ae9c34c632ad8d7b16)
    - The workbook is the output which is all of the evidence of property
    - This is what the final PDF looks like
    - [you have the ability to customize the workbook](https://loom.com/i/4351146266074a54aef6e1ee06a19257)
    - Customization Options of the Workbook (Show/hide sections, Theme selector, format etc ) - make some of them global settings on brand colors/fonts etc
    - 
- Builder
    - 
- Settings
    - Need ability to manage the compliance checklist and bank policy

## YouConnect Issues

- Bad notification layer ( impairs having a decent async notification from Parachute when the review is ready)  - fallback to email notifications for now.
- Issues with text format when copy pasting from word.

## Cody Questions

- How does this work from within YouConnect?
    - It links to a standalone microservice ( not a modal or iframe)
- Are we expecting parachute to be self-serve?
    - If so, we need to support the flow for providing the [compliance checklist](https://www.loom.com/i/f567cc7b195944f2bad2c5410e6926d2)
    - Answer is yes but vendor due diligence is a problem
        -