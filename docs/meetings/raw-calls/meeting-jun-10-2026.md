UX Sync | Realwired - June 10
VIEW RECORDING - 49 mins (No highlights): https://fathom.video/share/ubcZh6k-4uvQUfBaNr7vnd8RqMkwrH67

---

0:00 - Edward Kruger (Realwired)
  Nothing too crazy, but it's been just, you know, trying to get the new development team up and running and getting process in place and, you know, it hasn't been.  Oh, the new development team?

0:13 - Cody Miles
  Yeah, yeah.

0:15 - Edward Kruger (Realwired)
  What's that about? Man, it's, like, I think, you know, Stacks is great and, you know, I love them for showing up and, you know, for who they are, but they've just been dropping the ball one thing after the other, man.  Oh, they? Okay. Yeah, so it's just been unfortunate that I think you get to a position where you require someone that actually understands how to recycle and doesn't require so much, you know, handholding.  Right. So it's just been a process of, like, slowly changing the guard, I guess, you know. Wow, yeah.

0:52 - Cody Miles
  Okay. Well, that is a lot of work. So hopefully today, I think we're kicking off a new project, right?  Whoever the new dev team is, we can get them set up for success. Yeah, that's it.

1:12 - Edward Kruger (Realwired)
  Yeah. So let's review a little bit about where we are, and then let's talk about NetNew. Cool.

1:19 - Cody Miles
  Yeah. So agenda today, we're going showcase to you the progress on Uconnect onboarding. So it's going to include things like the CIS activity log, template type fields, and also the bid panel template column.  So I'll give this over to Val. Okay, cool.

1:35 - Edward Kruger (Realwired)
  Just one second.

1:45 - Val Vinnakota (brandcave.co)
  Sorry, my reversal logged out. All right. So a little bit of progress update here. We have pretty much done through all the requirements, essentially.  There's some feedback, a few bugs, and kind of being it production-rated at this moment. Zach, Missy, and their team actually went through user flows, captured some gaps there, and have worked through most of them.  At this point, it's essentially support, other than the one added feature that I've done, which is a particular way to do the vendor-grade scoring.  Otherwise, we are good on the app. So this is still a stubbed-out landing page, just so that they have easy access to it.  Whether they want to get into the hub or the CS portal loss, real quick, the changes you might notice now is on the hub side, we are doing a locking mechanism where we're only allowing, okay, this is, let's look at .  Yeah, so essentially we're only allowing some of the modules that are dependent to be unlocked at the beginning. So exactly.  You can do the org setup, you can define your definitions, do some general settings. User setup, I guess, the bank, I've enabled that for now.  But otherwise, you would have all your user setup, vendors, and routing would be disabled. So once user finishes them and the CS agent has the information that it has been done, they would unlock it.  I'll show that in a moment. But otherwise, most of this, I mean, the org setup is essentially pretty much the same as what you have seen.  With some gaps about, you know, the SSO information, etc., that only comes out when it's actually on the dev hand of, for example, places like this.  What is the setup guide looks like? And just a review, they're also doing it that they can inform automatically the user that they are done.  If they make any changes, that's when, you know, you get another. Notification, you want to inform that you're done.  So they move on to the other places. Definitions have expanded dramatically. They want to add a feature where they want to introduce the definitions video at the beginning of the module itself.  And property categories, your fields, editing fields, et cetera, there's request types. And a couple of more information that has emerged was they wanted to promote just the value premise and the value premise with four columns as the default with panel layout.  The other things are hidden, but still there as optional. There is a report submission module that arrived, which is essentially read-only.  There's a review panel that is a new... Part of the request form, and finally, of course, a review, and every one of them have now videos that are actually working.  Zach has recorded them, and let me quickly finish this module here. Market has finished. So on the CS agent side, like when they do the same, they would be getting notifications as they are doing it.  Sorry, I wasn't set up better here. So I also added like a Superbase, you know, a notification carrier whenever the user makes changes on the hub side, the CS agent.  We'll get automatic notifications that something has been updated. They could, of course, look at that in the activity log.  This is something you have seen before. And these would be the options that the CS4 agent would have. They would see which I completed.  They can review what has been updated and what's not. They can unlock and log the modules as they're working through them.  There's also where they can quickly look at the changes that the user has made. Right now, haven't made any much changes other than adding these two.  This would give them an idea of what exactly has happened as a quick way to glance and make changes.  Maybe you're doing particularly long periods. And also, like, if they just change something from default, they would just see those two changes and make those changes in Uconnect.  A bit more features on dashboard here. Essentially, they're onboarding timeline, which are the clients that... are onboarded right now, module funnel, and the status breakdown.  Yeah, those are both the major changes you could see. There might be some functionality changes here and there inside.  But yeah, as a summary, I could say that, yeah, we're almost there, other than some support and some bug fixes on this.

8:24 - Edward Kruger (Realwired)
  Can we hand it over at this stage? Like, is there anything else that we need to do from a UI, UX perspective, or can we move to a new protocol?

8:34 - Cody Miles
  Yeah, can hand this over if there's another engineer to, you know, finish up the work. Awesome, cool.

8:41 - Edward Kruger (Realwired)
  I could do that production-ready package. Sorry, go ahead. No, no, I was just saying it looks really good. Well, you did a great job, yeah.  How does it feel to do a little bit of development?

8:54 - Val Vinnakota (brandcave.co)
  Well, Cody just gave me a new title, product design engineer, so...

9:02 - Edward Kruger (Realwired)
  Nice, good job. Yeah, guys, this is definitely something different. Head Fiber. Head Fiber, sorry, we'll figure something out.

9:13 - Cody Miles
  Chief Fiber. Yeah, Chief Fiber.

9:15 - Edward Kruger (Realwired)
  Okay, so anything else that we want to discuss on this? Can we move on?

9:21 - Cody Miles
  So let's talk about handoff really quickly. So you have someone ready to pick up the work and finish it up?

9:27 - Edward Kruger (Realwired)
  Yes, I do. Cool.

9:29 - Cody Miles
  So Val, next step for you is just creating that package, creating like a list of tasks, remaining, you know, items to in context around that, and then, you know, shipping that over.

9:41 - Edward Kruger (Realwired)
  Sweet. Absolutely. Sweet. Okay. Can we talk a little bit about my new project? Yes, sir.

9:52 - Val Vinnakota (brandcave.co)
  Awesome.

9:52 - Edward Kruger (Realwired)
  Let me get my screen shared once. Okay, guys, so we're going into Parachute version 2.0. 2.0, bring some new ideas to the flow.  Just to give you guys an idea, you know, we launched last month. We launched in what we call, you know, our pilot program.  So it's fixed fee, you know, unlimited essentially. We've done about 100 appraisals through the system. The optics look really good.  We've already got our first client that's bought it for a year. So all in all, like, it just seems that this is growing at a rapid pace.  So we want to come by moving into phase two of this, just adding a little bit more flavor to it.  So let me just share my text. It's this one. Yeah, it's this one. Cool. Okay. So very simplistically, you know, I started just...  So... So... Building POC to send out as a BDO to our team to kind of get a sense of like what works, what doesn't work, would they enjoy using it, you know, that kind of stuff.  And the feedback so far has been really good. I do think there's a lot of room for improvement here, but I just want to walk you guys through what I'm seeing.  So essentially, this would be one of two things. First of all, this would be the housing for Parachute within Uconnect.  It would also be the standalone version for Uconnect, meaning that the version we sell outside of our customers. Okay.  So you hit sign in. What I did, you know, is just, you know, kind of like default dashboard. How many things are you waiting?  What's the situation? You know, what came back? You know, do you want to order a new one? You know, kind of like try to use a material view, but, you know, drag and drop, you know, give it a name if you want to.  There's some functionality here that I can change. You know, the system tries to extract a lot of this information.  It's awesome when it's embedded in here because it helps the extraction a little bit out, but I don't need it.  So there's kind of like a little bit of things that we can do really, but it's very straightforward. Like let's upload a PDF and you start running the pipeline.  If the pipeline starts running, you'll see that I kind of like try to show you the different stages. Where are we right now?  What's the process? What's actually going on? That is not that important to me. Not that it's not important. What I'm just trying to say is the screen is not final.  Nothing that I'm showing you is final. You know, it's purely POC. The meats and potatoes is this little portion.  So after you've opened a technical review, all the findings that we have now presented, you know, normally we gave you the PDF back.  What we are giving you back now is the ability to... Edit it. So you have this kind of like idea, do I accept it?  Do I disagree with it? You know, if I disagree with it, like what's the reason that I disagree with it?  You know, I want to save that response into the system. You know, what am I failing? You know, so in each category, essentially the category would be displayed.  And in that category, you can accept or deny it. Now, where this kind of like plays in is it kind of like allows you to compile the workbook.  You'll see that I also have the link back to the original. The idea between that is sometimes if it says something, I do want that ability because you can see the confidence score on the page.  I do want that kind of like ability to like, know, can I click there and kind of like open up the page number and show the PDF in comparison to, you know, the findings so that you can look for yourself because that will really fast track the review process.  That's kind of how I, do you mind if I'm pontificate for just a second?

14:05 - Cody Miles
  I kind of look at this as like you're creating the appraisal so it makes sense to show the appraisal and then like comments contextually from the appraisal.

14:14 - Edward Kruger (Realwired)
  Yeah, and you know, and that's kind of like the idea, like when I went through the product development phase here, the biggest sadness that I'm getting back from our clients is the formatting is a mess, meaning that they don't, it's not that they don't trust the system, you know, their concern is very much that they struggle to see, to pass this on as their own work because they don't have that.  And that's what kind of like makes them feel, you know, problematic. And so the kind of like three things that I have in my mind that me and Jeff came up with is, you know, we want to have people say with our product, I did it better with better efficiency.  I, it wants to. Show that it's my work with high quality, and I don't want to be able to miss material mistakes.  I don't want to just accept this thing and feel that I've missed something that's material. And so the biggest thing for us was really if we look at like those three things with the formatting, I wanted to give them more control over like it's fun to agree with what my system says.  It's also cool if you agree with my system and say, and I also want you to be able to pass this on as your final word.  Yeah.

15:28 - Cody Miles
  Are you using the accept or, you know, decline or reject or whatever as like an eval system? are you like, so in other words, it doesn't?  Yeah, to a degree, like not really.

15:38 - Edward Kruger (Realwired)
  I'm not feeding it back. Okay. I'll let me show you what I do if it agrees and disagrees and rejects in the comments.  Okay. So I compile this into this workbook. Now you'll see this is what your final PDF is going to look like, you know.  So you've accepted and overwritten these and accepted those two and, you know, the risk shows. And now you can go and say like, well, I  hate that it shows.  So when I kind of like go to customize, I have this ability to kind of like, let's say the documents of the site, you know, settings, say anything that I've rejected, hide them.  You know, if I disagreed with them, hide them. You know, don't show if I've overwritten them, you know, and like, hey, listen, I want this to be the color code, you know, and I want to use this font and this should be the things.  And you know what, I don't actually want to show the risk rating at all. And so kind of like, if they change that, you know, those settings, like I can take all of that away for them.  And this is how I make them feel in control of the output. Right. You know, because essentially, guys, what happens is we produce this output, and then they make this output part of what they call the workbook, which is essentially just saying that this is all the evidence associated with this property and why we made this loan.  that once I kind of like, an auditor looks at it, there's an evidence of property. And why? But they are most concerned about 99% of the time is that if Parachute gives them the output, they do want to make that part of the workbook.  But now that red thing is saying that this is a critical hire because there's some mistakes in the appraisal.  And then the chief appraiser doesn't agree with it. And now they kind of like feel conflicted in the workbook.  So this kind of like allows them to say, yes, they want to show this, they don't want to show this.  So there's kind of like a lot of customization options, you know, that I tried to put in here. Like show a risk rating.  Do you want to color? Do you want to change the names of the risk ratings? And then essentially some of the other things that I did is, hey, there's some sections of like the appraisal report that is not in yours.  Do you want to kind of like show the highest and best use? You know, do you want to kind of like show the subject paragraphs, you know, whatever that is, and kind of like drag and drop those in so that, you know, once they kind of like they can really make this their own, like in any way, you know, they wanted to.  Yeah. And that's kind of like what I want to build for them as a version two. So this is kind of like the idea behind it is give them more control over the editing of the final report, but use us as the engine that accelerates them.  Yep. Makes sense. Do you mind if I ask a few questions here?

18:16 - Cody Miles
  Yeah, of course.

18:17 - Edward Kruger (Realwired)
  Okay.

18:18 - Cody Miles
  So, I mean, ultimately we have a flow where we are ordering a review or requesting a review from Parachute.  And so we're uploading the appraisal document and then instantaneously we would see the, you know, the review being generated.  And there's a point there where we can provide feedback on review. I like this. I don't like this. I do like this.  Yeah. And then it produces for us a workbook or then we can, you know, modify every part of the workbook, give them some feeling of control over the workbook itself, even down to things like the colors.  All of that true so far? Okay. Okay, cool. So the way that I would think about... Some of these things is like at the workbook settings here, there would be some account level settings.  Like these are the colors of my organization so that I'm not changing that on a workbook by workbook basis.  I would probably, do they typically do the workbook in one setting? Like I would upload the document, make my feedback on the review, and then complete the workbook within the same flow of things.

19:28 - Edward Kruger (Realwired)
  It's an interesting question. Traditionally, it takes them about five days to go through a single review. Okay. And so we would expect them to...  Yeah. What we want to do is we really want to kind of like immediately highlight the criticals because this is where the step kind of like is really interesting, right?  If we kind of like do look at the review process here is at this stage, they can decide to send it back for review or not.  They don't have to. Set and compile it. Like, if they feel like, hey, listen, there's some real  things about this appraisal, and I don't want this.  I want to send it back to the guy that made it and ask him to make those changes before I get it back.  Because they can send it back to, you know, the person, you know, the reviewee and effectively say, like, listen, no, I'm not going to accept this.  Like, obviously, there's some problems here. The system picked up that you used $500,000 for your comps here, but you only used $800,000 for your comps there.  That's a material mistake. Like, you have to go fix that. Okay. What the reviewers don't like, where the fee appraisers, sorry, what the fee appraisers they don't like doing is they don't like you emailing me one mistake at a time.  Right. So I want my, I want the mistakes batch. So this is really like the first time that this person can go and say, like, okay.  I'm kind of reviewing it. The risk is a little bit too high for me. I'm kind of looking at these things.  I'm pressing the button to see the comparison in the appraisal. Yes, I agree with it. I do want them to fix these things.  Okay, I'm going to send it back, or I'm accepting it, or I don't agree with what parachute says.

21:23 - Cody Miles
  Do you have it here where you can send it back? No, I don't have it.

21:26 - Edward Kruger (Realwired)
  Okay, but that's something you want to do? That's what we want to do. We want to be able to send it back, you know, and say, like, you know, reject this.  No, it's not a good appraisal. And that effectively, you know, updates the dashboard a little bit because it's kind of like, say, it's like it's waiting for the reviewer.  Like, you don't have to kind of, because if you think about this being an office or department, you're going to see a lot of information here, you know, flowing in.  And so, you know, if you kind of like think about, you know, from that perspective, you do want to separate those different stages from one another.  But then, when you do kind of get in here. To help them to facilitate the quality of the data that they're coming back, but also to speed up kind of like that review process.  And then essentially giving them the confidence to say, yes, okay, the guy has made the changes that I've requested.  It's good. I've got the audit log. The audit log is set up. I've got all the information that I need to kind of compile this workbook and to sign off on it.  I've now signed off with it. You know, the appraisal can go. And that's what we want the system to start facilitating them.  Mm-hmm.

22:31 - Cody Miles
  Okay. All right. I think I get it. I mean, obviously, one of the biggest things my brain is having a hard time getting past, even though it's a very clear answer, is you have, like, the details view of a particular review as, like, a main menu item.  So I'm like, already, this would be one of the main changes.

22:55 - Edward Kruger (Realwired)
  a about the UI event. Like, I can do a demo. I wanted to get to a place where I can demo this to people because my question was, if I give you more control over the formatting, would there be a higher adoption?  And so everybody says, yes, they love this. They love the idea that they can accept, reject, and then have that ability to decide if they want to compile it into the process.  This wasn't the flow for me. This was really just a proof of concept. Can I click around in the demo and show them the different stages?  So that was kind of like the idea behind it. Yeah, super smart.

23:36 - Cody Miles
  It's cool because you already have some user feedback and some conviction on how things should work and what's valuable.

23:44 - Edward Kruger (Realwired)
  Yeah, and this is the thing. I kind of like that thing about this idea of maybe there's organizational templates that you've set as your standard.  And there's some rules associated with those standards, maybe. I was kind of like thinking about it. see. Let's Thanks.  Thank you. Even going as far as saying that, I know this is silly, but I was thinking about going so far as saying that, you know, free medium findings plus should automatically be rejected.  It shouldn't even show up in IQ. It should just send back to the reviewer and say, you know, here's the findings, go fix this.  And because what we are saying, the reason behind it is, is if your system, if a robot tells you your thing is , you're mad at yourself.  But when a human tells you the same thing, you're mad at the human. And so what we kind of like wanted to do here is you think about that ability to give the bank some protection where they can set the quality gate, you know, not be like, I hate this bank, but oh , this system is really tough to get into, you know, know, without like damaging the relationship.  You know, so to speak, because I mean, I can find all of those findings and saying like, hey, listen, I can just send it back to you and say, listen, we found some problems in your report, you know, if you, it's not going to pass the quality gate, here's the problems that we're finding, you know, please make these things correct.  Like, then that was this idea of like, can we set up like organizational templates? Like, I didn't, I didn't build too much in it, but this idea that maybe I can create a configuration that all of my documents look this way, and this is the settings for my organization.  And so when the system kind of like triggers those points, it knows how to jump off and do those, do those elements.  Yeah.

25:44 - Cody Miles
  Does the bank have the ability of like managing the compliance checklist here for what it's actually reviewing?

25:54 - Edward Kruger (Realwired)
  They will have the ability to change the compliance document. There's two little documents that they have control over. The first one is, like you said, it's actually an interesting question because the first thing that they do is there's an administrative review.  Have you ever seen the administrative reviews? I shown it? No. I'm not sure what an administrative review looks like.  Guys, if ever want to do good business, you buy a data center.

26:26 - Cody Miles
  I'm just saying, I just did a review for data center and it is lit.

26:32 - Edward Kruger (Realwired)
  Wow. Yeah, want to see if I can. Now's the time. Now is the time. Okay, cool. Okay, so let me show you what it looks like.  Let me present something else. I want to present this. Okay. Cool. So a compliance document looks a little bit like this.  I'll zoom in. This is, if I can, yeah. Okay. So this is a very simplistic version of this. But essentially every bank has got their own version of this.  Every bank has got a document that effectively has a number of questions, you know, in different sections with a yes, no, not applicable and or evidence page.  And essentially what happens is these questions becomes the rule set which the system uses to kind of like measure the effectiveness of the system.  Like it kind of like because of your bank is worried about, you know, something specific like does the is the appraisal in a bad neighborhood?  Like I know that that's a very subjective question, but for the AI to actually really go answer that question, it needs to know that that question is important to the back.  So these templates normally get uploaded. Once into the system, and then when you order something, you can either order the compliance checklist, which is this one, or the technical review, which is the one that, you know, becomes the workbook.  The compliance checklist, this one, is like the first kind of like piece of evidence that says this is not a  appraisal.  Like we can actually look at it because it qualifies, you know, based on the second look is a technical deep dive saying that is the information within the appraisal correct?

28:39 - Cody Miles
  Yeah, that makes sense. And where does it get that additional context from to know that the information within the appraisal is correct?  So I assume it's from Uconnect if you're doing it.

28:49 - Edward Kruger (Realwired)
  Yeah, so what we do is, you know, after we kind of like answer these questions, the system then goes into two different passes.  One is a classification model, know, so it says. Like, this is a data center, and then we are like, okay, you have to apply these rules, you know, this is what you need look at, like, you need to kind of, like, think about doing the map this way.  And so we have, like, a model that's specifically trained to then catch those, is the information correct in the document, and that's the result that we produced in the technical.  And so just on that note, there needs to be this ability to manage this form. This one doesn't change a lot of frequently, but every single time they do run an administrative, like, they do run it against this template, you know, like, if they select that to be part of the package of whatever they are buying, they do get this output consistently.  So we do want that ability for them to configure or create this output very much similar to what they do with the technical one.  The secondary thing that we want to do here is, um, There is an additional upload that they can do, which we call the bank policy upload, which is literally like a one or two page of like additional rules that says for, you know, our bank only does business if it looks this way.  And those rules can be interesting. It could be like scrutinized based on size or weight or like risk ratings or like there's a lot of like interesting information in a policy.  Those policies are normally like PDF documents or Word documents. We take those in as is, you know, I don't know if we really need to scrutinize and extract information in there, but we do use that as is information to apply.  We extract those into rules and then we use that with the final run to inform the conclusion. So we will tell you the surprise will, you know, satisfy 26 out of 30 of your policy rules.  Yeah, that makes sense.

30:59 - Cody Miles
  sense. Yeah. And these are standard documents. Every bank is going to have their compliance checkpoints.

31:05 - Edward Kruger (Realwired)
  Yeah. Yeah, I guess. Cool. It looks different formats, but it's the same thing. Everybody has it. Okay. Okay.

31:12 - Cody Miles
  The product that I just saw looks fairly standalone. When you're using it within Uconnect, how does that work? Yeah.

31:20 - Edward Kruger (Realwired)
  Great question. So within Uconnect currently, it is a button. Then 10 minutes later, you just get the file. Oh, I see.

31:29 - Cody Miles
  Okay. The features of reviewing it and customizing it, that's just kind of passed on?

31:38 - Edward Kruger (Realwired)
  Yeah. So this is the thing. I'm now moving into version two. I see. Okay. The version two perspective, I'm thinking about bringing that into the system.  Right. Right. Okay. Which, again, I don't mind having this be a button in Uconnect that says sync to parachute, and then you open the parachute link, and there's a complete...  Equally different microservice that's standalone, know, with a different looking field. I think that's a really fair, you know, process.  Yeah. Yeah, I mean, what I'm saying is, like, the window space that we have within Uconnect is already so constrained that I would hate to embed it as an iFrame, like, because that would just be fine.  Right. Yeah, yeah.

32:25 - Cody Miles
  Are you imagining that Parachute as a standalone app would be self-serve, or is that still kind of a sales-led initiative, or accounts are created for them, and then they're given access?  Great question.

32:36 - Edward Kruger (Realwired)
  I do want it to be self-serve. There is some complications within that. The biggest one for me is the vendor challenge, you know.  So for someone to onboard this product within their work stream, they need to go through vendor due diligence, you know, and that is never a fast project with a bank, you know.  So how do you self-serve? Really fast, vendor management is going to be the interesting question. So the way that we've been approaching it just from a sales perspective and a sales challenge is, you know, maybe you focus on getting the whales, you know, and walk them through a self-managed, you know, vendor onboarding process.  You know, they can use it, but, like, I can promise you, you know, if there's any IT system, you know, John, John Rogue at Bank A is not allowed to visit this website and just run appraisal through because where does the data go?  Who owns it? You know, like, do you use this for processing? What is your AI regulations? Like, there's no way their IT team will allow them, you know, to send any of that information outside of their little protected ecosystem.  So that's the big concern with, like, self-serve. So I am happy with the... Version 2 to be a, I'll create the user accounts for you or allow the SSS pass, you know, pass through for you, the SSO pass through.  But on a get, yeah, I do want to get to a position where we can solve the problem, like, you know, in a way, shape, form, or whatever.  Yeah, okay.

34:19 - Cody Miles
  I don't know that I'm fully understanding the vendor due diligence problem. Yeah, sorry.

34:27 - Edward Kruger (Realwired)
  Do you want me to walk you through that, Cody? Yeah, please. Okay, so vendor due diligence. If I have a product out there in the universe that processes information, right, and this is now considered protected information because it's within the banking ecosystem.  So if I, if the vendor has no relationship with me, if the bank has got no relationship with me, they are not allowed by any of the internal policies to share any banking information with me, you know.  Mm-hmm. Mm The biggest concerns they have is things like who is responsible for the information, know, how does it get processed, you know, now I'm like taking away PII.  And so there's a lot of like, like we have SOC compliance, they have an internal one that's called GLBA, which is very much similar to, you know, any PII, you know, GDPR, it's the same compliance rules.  And so information cannot leave the bank without you being on an approved list, and they know what the data handling and classification of that information is, is the moment it leaves.  I see now.

35:36 - Cody Miles
  Okay, so when we're talking about vendors, we're actually talking about AirShoot itself having to be approved.

35:41 - Edward Kruger (Realwired)
  Exactly. Yeah. And so, yeah, if we can, like, I want to build in things where I'm like, your information gets automatically deleted, you know, if you're, can in that space.  But if you send it over here, it gets processed and removed, and, you know, here's your full audit trail, and your audit log, and here's.  I need to go through all of that before I can even get close to self-serve.

36:06 - Cody Miles
  Right, right. Okay. Yeah, of course, it couldn't just be that easy to create an account and start processing this PII type of information.

36:18 - Edward Kruger (Realwired)
  Oh, okay. I got it.

36:19 - Cody Miles
  So in the V2, you said you'd be happy then with more of a sales-led motion where the account kind of gets initialized.  Y'all sell for vendor due diligence outside of an onboarding flow. Okay. Yeah, 100%.

36:34 - Edward Kruger (Realwired)
  Yeah. So not to go much concerned about that flow, but yeah, anything else that's kind of like been popping up for you?

36:40 - Cody Miles
  Yeah, so redesigning the standalone app seems really straightforward. There's a few ideas I have that I'd like to try out in this, but, you know, otherwise, like taking the functional requirements that you've provided, I mean, it's incredibly clear of what needs to happen.  Oh, awesome. But in the Integration with Uconnect, you know, you said, obviously, we don't just want to, like, port it in as, like, an iframe or something.  Yeah. Would that mean we would try to create an experience within Uconnect where, like, there's a route or series of routes that are actually parachute, but it's within the app shell of the Uconnect app itself?  Yeah.

37:20 - Edward Kruger (Realwired)
  So the way that I'm thinking about that is that, you know, this sends out Webhooks and Uconnect listens to the Webhooks and intercepts it and, you know, downloads the information, you know?  Hmm. But that the information kind of, like, then resides within the protected space of, like, this run, and, like, Uconnect just finds a way to kind of, like, listen to those updates and connect to them, you know, but that the source of truth becomes this and not Uconnect.

37:50 - Cody Miles
  Okay. Got it. So when it comes to those settings that you, for example, ... We're calling out like how we can configure the workbook.  How would you imagine those kind of those settings get configured from within Uconnect?

38:10 - Edward Kruger (Realwired)
  So the way that I'm thinking about that is that a Uconnect customer would click on configure my parachute and then parachute microservice with that page and login experience.  Oh, I see.

38:26 - Cody Miles
  So there's a shared off layer and then you still kind of get kicked out into the other like standalone app.

38:32 - Edward Kruger (Realwired)
  In a way. Okay, cool. Yeah, makes sense.

38:37 - Cody Miles
  In that case, that's just the cleanest, Cody.

38:40 - Edward Kruger (Realwired)
  you know, otherwise I'm building something that I'm maintaining in two places. In two places. Totally. Yeah.

38:46 - Cody Miles
  But the one thing that we might do to improve that user experience from Uconnect and transitioning over to parachute is like sometimes in UX patterns like that, you have like an interstitial screen or it's like a fake loading screen and it says like.  You know, transferring you to, you know, Parachute, you know, just wait a moment, you know, like you see that in platforms like Expedia when they send you over to like Southwest or whatever.  Oh, I understand what you're saying.

39:12 - Edward Kruger (Realwired)
  Yeah, I mean, definitely. I think that gets great patterns for us to do. You know, the truth of the matter is that a Parachute appraisal takes about 10 minutes, you know, for you to kind of like come back.  And so it's not really blocking to the workflow, you know, as much. Like people go on with their work, they work on other things, and you connect, they're copying and pasting and clicking other buttons.  And so I think the Parachute can be an experience of its own. Like it doesn't need to be embedded, you know, as much.  I think it's more about like, hey, you know, your report is ready. You know, click here to edit it in Parachute, you know, and it jumps you over.  Ah, sure. Yeah, that makes sense.

39:55 - Cody Miles
  Okay. Yeah, so and I think like, you know, to that point is we all

40:00 - Edward Kruger (Realwired)
  You know, working with an asynchronous flow. So, you know, appraisal can be in a state and, you know, the parachute comes back 10 minutes later.  so it's a little bit of a notification, I think, that we need to figure out, like, how do we do that?  That's a curious one. Do you have a notification, like, Bell or notification system in Uconnect? Not a great one.  And I think, like, there is some small things that have been really bothering me about Uconnect that I do think just needs a small UI refresh.  But notification and change management, like, what has changed? You know, what's the last things that we've rolled out? I would love for that to be, like, somewhere visible within the system, you know, slightly.  We have a banner system, but, I mean, it's really bad. And then the other thing that I think I'm a little bit concerned about is the most amount of time and energy that we spend in, like, stupid bug fixes is when people try to edit.  Documents, you know, within our system. And what we've. done is we've used that same top-to-bottom approach where we have, you know, hey, you know, here's all of the property information about the system and sorry, that takes up half of your page.  And okay, now you have to scroll down and you get this second section, which is on your screen that allows you to be this editor.  And what people do when they configure, like, for example, they configure this compliance checklist right now, they copy and paste this compliance checklist in Word, you know, from Word, and then they paste it into this thing.  And then the formatting goes all wrong. Right. You know, and then I literally have a developer fixed formatting, which is changing the pixel sizes, you know, the margins in CSS, you know, to adjust the things together in the center.  And then they have, like, this idea of thinking of injecting specialized, like, little code sections to fill out the answers, you know, to do almost like a  Mail Merged Approach. And then that experience is just, it's just so, so, so, so horrible. I can imagine, sure.  And we do that quite a lot. Like, we call that, you know, when we do templating, and there's a lot of templates.  Like, you know, hey, someone wins a bit. There's a template for them. Like, what does the email look like?  You know, what does the benefit look like? You know, whatever. So what I'm kind of, like, hoping that we do is we just find a better way of, like, managing this.  It's that little word editor in there that doesn't actually serve us, you know, a great purpose. doesn't really speed up the user experience.  So I do want to spend a little bit of time on that because I think if we just redo that part of, you know, Uconnect or represent that, like, there's just so much offload of, like, maintenance that we take from the team.  And changing that into self-server, self-managed, you know, protocol is, like, definitely the way to go, yeah. Totally. So, yeah, I think we should look into that.

42:58 - Cody Miles
  And then just as, like. Like a near-term, like a very near-term, short-term solution. I mean, we could just rely on like email notifications when like, you know, the status is complete for the review, right?

43:12 - Edward Kruger (Realwired)
  Yeah, I'm not too concerned about that. Yeah, so definitely we can do that. Here's an interesting challenge. I do want to roll it out, you know, as soon as possible.  Like I do want to, I'm going to build a standalone version of this. For the sales team, so that they can just walk into demos and show people how Parachute works.  All right. So I'm going to build a fake version of this with Claude. You know, I need to get that done on Friday, so I think it's unfair to push that to you guys.

43:47 - Cody Miles
  It'd be a tough one.

43:48 - Edward Kruger (Realwired)
  Yeah, it'd be really tough for us this week. So I can get that done today and tomorrow. Like, I know it's not going to be the final version, but it will be a version the sales team can be using.  Okay. I'm happy to spend... you. Next week on the refinement, but I need to start offloading this as work, like, closer to June, July, because, like, theoretically, my target date to get version 2 out there is mid-July.  Now, realistically, it doesn't mean that I need it to have fully complete, because I do know that there's going to be a longer sales cycle associated with this.  The banks normally do take, like, three months to get there, but I just want to offload this project so that I can actually move on to other projects, because we need to start defining our bricklayer, you know, project.

44:37 - Cody Miles
  Yeah, I love it. Here's what I think we should do. Let me take this conversation, let's create some sort of, like, high-level definition of done that I can share with you that we say, like, by mid-July, you said mid-June or mid-July?  It's already mid-June, shoot. By mid-July, that we have, like, this is our target that we're working back from. If I could get access to the current...  That way I can play around and get a strategy together. I'll make sure that Val is aligned with me and we'll start obviously with the app shell initially and then just start knocking out the various routes.  And if you, because like probably of course what we should do here is like we're just stubbing out, you know, screens and we could do this in a way like we've done it before where we just do the front end and hand it off to an engineering team to do all the integration layers.

45:27 - Edward Kruger (Realwired)
  Or we just do a prototype. You know, Cody, because I think like the client, you know, I don't mind the way that you guys are creating things.  Like I think that's wonderful, but the client process just took a little bit longer. Yeah. You know, I'm worried about the fact that, you know, I'll get it by mid-July, but then I still have, oh, I need to change these databases and I need to swap these spots out and I need to build those APIs, you know.  Yeah, yeah.

45:55 - Cody Miles
  I'm not, I'm not actually trying to communicate that. I think that, I think I am completely aligned with you.  I feel like Val was more like a forward-deployed engineer, and he was like really embedded with, you know, Missy.

46:07 - Edward Kruger (Realwired)
  Yes.

46:08 - Cody Miles
  But that ultimately, I think, kind of cycled out a little bit more than it should have. So I completely agree with you.  What I'm not suggesting is that. I'm suggesting more like we, I don't want Val to be concerned with the API.

46:22 - Edward Kruger (Realwired)
  Yeah.

46:24 - Cody Miles
  I want him to prototype. And so he could either just, you know, prototype and clawed code, and he can create a beautiful prototype that way.  Or we could provide a front-end that is still stubbed out. No API. He's not concerned with the API. But there's like a mock service layer that, you know, you could hand over to a real engineer, and they can say, okay, cool.  This is what front-end expects, and own the project from there, you know.

46:48 - Edward Kruger (Realwired)
  Yes. I think, like, just given our time constraints, we'll probably be faster with a prototype, and then have an engineering team just run through it, like, commitments and tickets.  Because that, I think, that allows us to. To crack the whip and really understand if there's any complications. And I think it doubles the speed of Val because he can get really just  with prototypes, you know, and change things and get that through.  Yeah, and just have a separate repo. That's all it is. Yeah, that makes sense. Okay, cool. Yeah, so we'll stick with that.

47:15 - Cody Miles
  Like, I think the conclusion here is like, don't go back to Figma. That's way too slow, but we can deliver here in a prototype that dev team can still introspect and have an understanding of what to do.  And also a line that, like, we're trying to deliver the final product by mid-July. So we need to work backward from that, giving time for engineering to actually do their work.  Yeah, especially if we want to kind of like do it and say like, this is the look and feel.

47:39 - Edward Kruger (Realwired)
  Let's just start with that for the first sprint. Yeah, yeah, yeah. So let me put a plan together and get that back to you shortly.

47:47 - Cody Miles
  So recognizing the timeline and acting quickly. I appreciate you not asking us to get the sales demo done by end of week.  It just, it would be impossible. No, it would have been.

47:58 - Edward Kruger (Realwired)
  I don't think it would have said that. okay bro uh cool yeah you'll hear from me uh in the next day or so cool Cody I've got plenty of more work for us so let's just knock this one out of the park and then move on to the next one absolutely okay thanks well I'm gonna pull you into the stand-ups just so that we can do that handover sweet sounds good awesome thank you okay thanks bye guys see ya um and send me that link if you can we'll do okay bye yeah bye