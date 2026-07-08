UX Sync | Realwired - July 07
VIEW RECORDING - 52 mins (No highlights): https://fathom.video/share/ZGwg-yfxrjX1MJzXwn5BcaejzjHwu6zZ

---

0:00 - Cody Miles
  You just announced Fable will be available until the end of the week. So that's cool. Yeah, I saw it like five minutes ago until 12th.

0:14 - Val Vinnakota (brandcave.co)
  So I'm wondering, I should use Fable to introspect all the projects and kind of see what best could have been done in terms of maybe prompting or how to approach them.

0:30 - Cody Miles
  Yeah.

0:31 - Val Vinnakota (brandcave.co)
  Any other ideas that you feel might help us out in this week using Fable Pfeiffer?

0:37 - Cody Miles
  I mean, the thing about Fable 5 is that it just does such a good job of kind of thinking through a process like each turn it takes is a little bit longer, but then you ultimately have to like have less turns.  I mean, I've in the past week, I've shipped an ungodly amount of features for Ashore and required almost no, I mean.  Literally just seconds ago, while I was in another client meeting, it shipped a customer portal. I mean, that's a feature that we've been wanting to do for years.  One thing that I used for the first time early this morning, there's a Claude skill for code review. I guess it's just like it's available system-wide.  And I used Fable to do a code review, and it was actually like really thorough, like really, really good.  So, I mean, anything where you have to, you know, kind of look at your own work, you might invoke that skill just to try to clean it up, you know?

1:46 - Val Vinnakota (brandcave.co)
  Yeah, perfect. Real quick, did you feel like when Fable came back last week, did you feel like they nerfed it a little bit?

1:54 - Cody Miles
  No, I saw a bunch of people talking about it like that, and I felt like it was only absolutely...  Murdering for me. But at the same time, people I know are like, I don't know, and it doesn't even seem that much better than Opus.  And I was like, I wonder how much of the success of Fable just comes down to how good you are at prompting and how good your existing patterns are.  Because AI is really good at extending good patterns or just extending patterns. So if you have bad patterns, you're just going to extend bad patterns.  By the way, go ahead and pull up everything you're going to show today. Okay. Just in case, you know, here's Ed now.  So just be ready.

2:41 - Val Vinnakota (brandcave.co)
  Yeah.

2:44 - Cody Miles
  Hey, Ed. Hey, Guy. How are you, man? You're in the office. Do we have sound yet?

2:53 - Edward Kruger (Realwired)
  Do I have sound? I can hear you. Yeah, awesome. Cool. I got you. All right.

2:59 - Cody Miles
  You're in the office. Well, yeah.

3:02 - Edward Kruger (Realwired)
  It was my birthday yesterday, Cody, but thanks for remembering. Oh, happy birthday.

3:07 - Cody Miles
  Happy birthday. I'm going to make sure that gets on my calendar, man, on July 6th.

3:12 - Edward Kruger (Realwired)
  July 6th, very important day.

3:17 - Cody Miles
  Incredibly important day. Okay. You are memorialized on my Google calendar now.

3:24 - Edward Kruger (Realwired)
  Never forget. Lest we forget. Lest we forget.

3:27 - Cody Miles
  Yeah, absolutely. All right. So here's what I'm hoping to accomplish right now. Val, as I asked, bring up Parachute on screen, please.  Walk you through everything. You saw a lot of it last week. Made some changes. In particular, the biggest one, the biggest change we made is kind of the multi-review stuff.  Any other big things that we changed, Val? We have the dedicated review screen now.

3:56 - Edward Kruger (Realwired)
  Yeah, yeah, yeah. Okay. But other than that,

4:00 - Cody Miles
  I want to see if we can get this across the finish line.

4:03 - Edward Kruger (Realwired)
  Yeah, before we jump in, want to see if I can get Jeff on the call as well. Okay, great.  I think it would be cool because I need sign-off from him as the SME. Aesthetically, I know exactly what I want, but the big problem is Jeffy, Jeff, Jeff.

4:32 - Cody Miles
  Well, my hope is that we can get this approved and delivered today so that you guys aren't blocked anymore by us.  Okay, cool.

4:41 - Edward Kruger (Realwired)
  Let me get my start. Did you do anything fun for your birthday? I get my stuff off the head.  No, Cody, it was a  show.

4:53 - Cody Miles
  Oh, sorry. Unfortunately, yeah.

4:56 - Edward Kruger (Realwired)
  I broke up with my girlfriend. I broke . Oh, And so all my plans got canceled, and then, you know, I walked into her and the family, you know, over the weekend, and then she wanted to do something for the birthday, and then she didn't show up, and I was just a   show up.  It was just one of those, like, I don't even know how to describe it, moments where I'm like, okay, I'm just sitting here, and, you know, I got a  birthday card with a piece of cake from her, and I was like, oh, okay.  Yeah,  her.

5:31 - Cody Miles
  I don't know. Yeah. Are we recording this? Yeah, yeah, sorry.

5:37 - Edward Kruger (Realwired)
  Yeah, so sorry, man.

5:39 - Cody Miles
  That sounds...

5:40 - Edward Kruger (Realwired)
  Yeah, so, no, it kind of, like, very unempressive, and, yeah, but I'll, I'll, maybe I'll talk to you about it.  Yeah, We're doing meetings. Yeah. Okay. But what did you do? How was your 4th of July?

6:10 - Cody Miles
  You know, I got two young kids, so I wanted them to sleep before all the fireworks went off, you know.  But my son is like a full-on vibe coder, and so he comes with me on Sunday mornings to the office, and he's created this Mario Kart game, and it's actually really good.  He's like 3JS.

6:30 - Edward Kruger (Realwired)
  He's six years old.

6:31 - Cody Miles
  He's turning seven this weekend. And it's really impressive. I started a computer program when I was six, so...

6:40 - Edward Kruger (Realwired)
  Were you? Yeah. I did it the old-school way, but yeah. Yeah. Okay, we are ready for you. Let's go.  Okay. Hey, Jeff.

6:50 - Cody Miles
  Good to see you. Hey, All right.

6:55 - Val Vinnakota (brandcave.co)
  So what I'm going to present are two pathways into... ... ... ... Thank Applying for a review on Parachute, one is directly straight from Uconnect, and the one is the standalone app that is Parachute.  Let's start with how it works on Uconnect. So imagine this is your Uconnect request form. We do have a multi-toolbar here that user could quickly run a Parachute review on there.  It takes them to this interstitial layer that it is connecting to Parachute. It established the connection, and the first question it's going to ask is, confirm the configuration for this review.  What kind of review that they want, they already selected the report. So the review types here would be, by default, we are providing both technical and administrative.  They can ask for at least one of them. If more work to come, such as like evaluation or vendor short form, they can also coexist here.  So depending on what kind of review types that they select, we have conditional configurations for those review types. In this case, the technical review setup for now, the workbook layout itself, which is a default.  All that we have set up in the app of Parachute for the user, they can change that just for this, if they want to do that.  Similarly, for admin review, you would now see that the admin review setup is available depending on the bank compliance checklist.  We will have that. Similarly, they can change that. So once they select and they're happy with the system that has identified the details here, they can proceed and start the review.  Note that we have selected two types of review and this is how the process works. So this is how it starts, where it starts to review at least one or both of them simultaneously.  And when at least one of them is finished, in this case, the technical review is ready for review now, but the administrator is still in process.  You would have seen it. Let me quickly do that again. You could see that the other process would still show like where it's at in progress.  Once both of them are available, you'll see in the tabs that technical review is available, the administrative review is done, both of them are ready for your review now.  This way we can scale it up to multiple different kind of reviews as well. Starting with the technical review of this, the first landing area that user would see is the workbook that the AI has generated with some findings which it prompts user to review.  They could go into the findings itself, and you can see like this is the source appraisal document from which the review has been performed, and the findings rail on the right side.  So you might have like several findings. Some of them, you know, has a lot of audit trail, and you can see the annotations for which  The AI has marked them up on the document. So what an individual finding would have is, you know, it calls out the intensity of the finding and it pretty much answers the question of, you know, what we have set up in the document.  What was the evidence for that? It talks about the citation here, which page number, what was the annotation. And an AI audit trail as well, where, you know, in which process it has found certain discrepancies and what it has corrected for.  However, it kind of gave you the decision here for you to approve what they are finding is true. So user could accept the decision as is, which records that user has accepted as it is written on the workbook.  Or they could also, you know, reject that. And this way, while rejecting, they can insert a response template from one of the templates that we have in the database.  Or they could write it on their own. Requesting that is their decision. Along with this, you can quickly see as soon as the user makes some decisions and choices, the workbook is now regenerating.  It kind of shows what the reviewer has said. They have concurred to the AI's, you know, finding here, continuing that.  They can also do certain editing on what the AI finding exactly has been, essentially, again, letting them find something from the condition here.  They could do that, or they could also, of course, accept. They could also, like, comment as well as accept whatever they want to comment on that.  Similarly, they should be able to do other additions here as well, along with, you know, setting a flag for that, that they need to do a follow-up.  All of this would be recorded in the audit trial here. Let me quickly accept them all. So once the user is ready, they have checked out the annotations, they have confirmed the additions and the findings here, they can regenerate the workbook real quick, it falls in all their decisions, it shows them like a clear cover, like I mean I could use your anonymized template to exactly nail the design here, but we have the table of contents, certain elements that user has conquered, their flags, whatever they have edited, what is their note on that.  Ultimately once they are ready and reviewed that, they can of course like do customizations on this right here, it uses the default template, but of course they can change the colors, headings, and even certain sections as well, like if they want to rearrange all these sections up here, they can do that, delete some of them, once they're happy with what they have in the workbook, they can go ahead and sign and finalize that, two ways of doing that, either to type the name or draw.  So that has finished the, you know, the workflow for the technical review and the call out here is you can, of course, like download it or now that the other review is ready, in reality, it might have taken longer, but once it is ready, they could review the administrative review and admin review works pretty much the same.  Here, the workbook is similar, but it is an attestation document. It has provided an attestation document that says, hey, the citations are here, but, you know, you haven't registered yet.  They could go ahead and complete the attestations on the checklist rail over here. Again, looking at the original appraisal document, what they have suggested regarding the questions in the compliance checklist, it says it is not applicable in this document.  So user can agree to that or user could say, yes, this applies. So, yes, I agree with the decision here.  And if they have to, if they want to overwrite the ice review, they can. They Change and give their reason here and confirm that change.  And this way they would have attested every one of them.

14:08 - Edward Kruger (Realwired)
  Let real quick do this.

14:13 - Val Vinnakota (brandcave.co)
  So that kind of fills out all the attestations that they have done for the checklist items on this attestation document.  Similar fashion, they would regenerate that attestation document. And now that they can see what kind of answers the user has given here, if it has been changed, what are the reasons for that?  And the workbook is now complete. Then they would have go score it and sign it and seal it. And they can just quickly be back on Uconnect once they're done.

14:47 - Edward Kruger (Realwired)
  Can you go back up to the bit when you logged in? Could you come in? Yeah, go back up to before you logged in, very first screen.  He wants to see that. Type home screen.

15:02 - Cody Miles
  Are you talking about this, Jeff?

15:04 - Edward Kruger (Realwired)
  So this is the demo thing because there's going to be a standalone entry that's going to show dashboard and then...  But this would be for Uconnect or not? Yeah, so this wouldn't actually show up. Like, they would be in Uconnect and if they press the button, they will go to, you know, just that path.  That's right. Okay, so, you know, very eloquent. Eloquent, that's what we're about. Well, here's my challenge because you're talking, the ICP is, they've been working in the same way for years and years.  So my brain is struggling with it too because what they want is not best practice. That's best practice, right?  So what happens in their mind is picture, and I had two calls today, two different customers. Jeff, how do we use this?  And he gets to this part and I said, And some of them are, I like the format. And But it takes me too long to manipulate it.  Because what happens, I think, with this, their assumption is it's going to, Parachute's going to identify issues. I then need to write a report.  This assumes that I'm in the report and it's going to be, it's going to grab everything except reject comment.  Oftentimes there's going to be additional comments that Parachute didn't catch or a nuance or whatever. Oh, I see. So the way they're using the product now is they look at Parachute and they're like, oh, cool.  That's really interesting stuff. They then go to the PDF appraisal and they start reading it. They may zoom in on what Parachute identified.  They're still going to read the whole thing. They should. But they're going to zoom in. This one assumes that everything is caught.  They may find it. Thanks. So I struggle with what they really want is. You know, I need to save time, and I feel like I'm manipulating, not even this, but taking a step back when they get the Word doc, and it looks like that they're, like, I don't agree with this one, so they delete the column, but it gets messed up because it's in cells or whatever word chunky it is.  So picture you of somebody that's used Word docs forever. What they're used to is they open up the Word doc, this is before a parachute, they open up their review, they open up the appraisal, they copy some paragraphs, regurgitating the subject, and then they go walk, you they go narrative on it, on a problem, you know, whatever.  So I think we're at this weird spot to where this is way more elegant than a Word doc, but yet they get frustrated if they have to duplicate work or I'm spending all my attention.  I feel like I'm having to validate a parachute and then go make sure the AI is correct. It seems like it's creating friction.  And then I thought, well, even if you had a magical Word doc and you did what you just did, accept, delete, you know, what's the quickest way for them to get to the end product?  And I kind of struggle with, seriously, it's just a Word doc? So at the end of the day, if you have to produce something, you can have some customers that will be okay with the pear shape, way it looks.  Others will be on their own looking Word doc. And I keep struggling with it because what you're doing here is much more eloquent.  Right, right. That's my struggle point.

18:47 - Cody Miles
  So two thoughts in responding to that, Jeff, and I just want to test these with you. I heard two things.  One would be that there are some things that AI is not going to pick up. So there's... Annotations that they might want to add to the workbook itself, and what we're not currently doing is allowing for the user to create their own annotations in the findings, that would then get surfaced in the workbook.  So that might be a feature we add. So testing that with you. The second is the actual workbook itself.  They want to use their own Word doc. The thought is just multiple download paths for extracting the workbook out of Parachute.  One might be the nice PDF that we provide. Another might be just here's the text. You do whatever you want with it.

19:33 - Edward Kruger (Realwired)
  But if I had side-by-side, and that's a great idea, but if I had this side-by-side with, let's say I had a Word doc, or even a PDF, something with functionality, let's call it a Word doc.  And you said, ready, set, go. And you've got, you want to keep 90% of Parachute. You want to add some stuff.  You don't necessarily want to move it around, but you want to delete some stuff you don't agree with. You may want to add some stuff you kind of agree with.  So... He said, ready, set, go. Who do you think would get it done quicker working within here? I mean, I think it's here, but I'm talking about mental friction.  Yeah. If somebody's used to that, do you think they can figure out, hey, I just want to work in Word and just get this thing out?  I feel like I'm, I was, and it wasn't only one customer, but she got frustrated with the existing Word output.  It's like, oh, I have to manipulate the column size every time. I'm like, wow, really? You're, you guys went from not trusting AI to.  Column sizes, right? Yeah, right. So I'm like, holy , how do I deal with this? Yeah. So they're not battling the, I thought I'd spend more of my time battling AI, more of this, where they're like, I just want it to be easy.  I need it to save time, Jeff. I'm like, , okay. So. Yeah. You see my dilemma?

20:57 - Cody Miles
  What I think I'm hearing is. We just need the ability for them to edit the workbook itself. You know, and what I don't mean is like, can we get into that state real quick, Val, where I have the workbook?  Yeah, of course.

21:13 - Edward Kruger (Realwired)
  Like, yeah, if I didn't have to, you know, kind of, obviously, you have to generate it.

21:18 - Cody Miles
  So we, you know, we currently, when we show, we do the review, we get the workbook, we get the output of the workbook.  And what Val has here is the ability, and this is largely from Ed's kind of product vision originally, of customizing the workbook.  And that's, and really all that's doing is rearranging, Val, just want you to customize it, buddy. You know, colors, rearranging sections, turning off and on sections.  What this isn't supporting is inline text edits. And I wonder if that's just the only change left, where it's like you kind of format it, and then you can make, like, the changes you want into the workbook before you export.

21:52 - Edward Kruger (Realwired)
  So, for example, if I wanted to move something, do I still have to manipulate it with the tool? Or can I, on the fly, start making edits to this document?  It's a good question.

22:08 - Cody Miles
  It's kind of a hard technical feat to support both, I think.

22:12 - Edward Kruger (Realwired)
  And we'd probably speak to it better than me.

22:14 - Cody Miles
  You might have kind of a two-phased approach to it where you kind of, like, adjust the settings and it creates kind of this editable version then that you can just manipulate and do whatever you want to in.

22:25 - Edward Kruger (Realwired)
  But we have a competitor in the space, and it sounds like it's super lame, like a Word doc, but they like the flexibility, and I haven't seen what they're doing with their output.  No, I haven't. But I do wonder if the inline-acadet is probably the missing thing. Right. That's what Miles does for me as well.  You know how easy, is this HTML? Is that what this is? Yeah. It'd be super hard to edit. Yeah.

22:56 - Cody Miles
  Yeah, it'd be super hard to allow for inline edits. And keep the functionality in the right sidebar there where you can, like, change sections.  Because, like, it's a pretty opinionated section, right? The moment that you start kind of doing your own inline edits, maybe it breaks those sections.

23:12 - Edward Kruger (Realwired)
  Let's see, yeah, two different versions. And one didn't have any of those, that side functionality. And this was, what's the word you called for editing?  Inline. Inline? Yeah. If this document was inline, since it's still HTML, wouldn't it be very limited? Like, I couldn't grab number this.  No, HTML. I'm going drag it around. can't move it, like, a I mean, you could. You could. It's just about how you can, like, create it in inline edits.  But effectively, when you see inline editing, you're thinking about markdown files. And markdown files are really easy to export to Word or PDF.  But it captures the same functionality. But markdown itself is an HTML language. So you could markdown edit this, effectively giving you.  Control over, you know, moving it around, copy and pasting, know, changing the leading sections. But, you know, to Cody's point, this is, you know, kind of like layering simplicity over complexity.  What I can't get over is, in their mind, this is the tool that starts the process. And I feel like it's forcing me to stay in it.  And again, I'm thinking from their perspective. If I have, if you put the gun to the head and I've to get this done, I feel like, it may not be true, but I feel like I've done Word doc for decades.  I can crush it and just copy and paste, copy and paste, move  around, and I'm done. And I think this feels like, notwithstanding the setup, let's see if the setup was done.  Again, there's certain things that it feels like they're speaking to, well, this one says accept, reject. It's a linkage.  But yet, it's so elegant. So I hate to go back and say, oh, how do we manipulate WordDoc? Because I do wonder, to Cody's point, if you just have this ability to copy the section, if you just want to dump it into your WordDoc.  But I thought that was hard to do, the other one. No, I mean, let's say they have WordDoc on their computer in any case.  Because, you know, then wouldn't we want to just give them the ability to, I mean, maybe click on number three and say copy, and you copy it.  And if you paste it, will format itself correctly in Word. How about if you click a button, you can still have the functionality if you want to stay there, versus it just makes a WordDoc.  You do the WordDoc. You could do that as possible. Or you still have the weird, are you locked into boxes and ?  No, we could give them a template. The problem is just that what this gives you is this gives you the audit trail.  You know, you see the ability to kind of like change things and, you know, change, which in their WordDoc you'll never have.  It seems to be a little inconsistent. think there's some people that won't use the format at all. think there's some people that will use it 100%.  And I think there's others that need the annotation to say, I touched this. Because if a regulator's using it, and you don't have any of the annotation, it's like, oh, you just let AI do this?  No way, bro. You have to prove that you did something to this. That you had it. Like, how do you add a comment here?  Well, I mean, and I think, like, adding we can do quite easily. Like, for example, you know, the inline edit on this could be that, you know, you would be able to select any one of these cells and press a button and say, add comment or, you know, agree or whatever.  You know, we can have that process to be inline on the document as well. You mean, like, physically have a button.  Yeah, exactly. Like, you know, if you kind of, like, yeah, if you kind of, like, hold your mouse over, maybe it pops up as a tooltip that you just.  Okay. Yeah, think if something's actually on the doc, it would feel like a Word doc. you had, let's scroll down to, uh, just do a review finding, you know, scroll down to, yeah, just do a finding.

27:16 - Cody Miles
  I think it just passed it, section six, right? Is this a finding right here?

27:24 - Edward Kruger (Realwired)
  So just click on, could you just open up one, Val, just review the first finding, even if that's just a paragraph change.  Oh, okay. Yeah, just open up. So, I mean, this is kind of like the idea. Let's say, you know, this is injected, because this is how I see it.  Let's say this is injected by parachute, and it allows us to kind of, like, hover over that, and then have the tools, you know, to make the decision what you want.  Do you want to keep this? Do you want to remove it? Do you want to delete it? Do you want to?  Why not highlight these? We'll, we're taking, uh, we're saying that this is data that was in. This is a finding, and it's now inserting this finding in a section for review.  So this might as well have been a table of information that's being extracted. But what you can obviously see is the evidence in how it tells you the story about why it's saying that.  I'm going to go to top of the document. Why does that form a little different from the last one?  Because they are just utilizing a templated version so that they can mark it up to us. It's not the actual one.  Yeah, yeah.

28:55 - Cody Miles
  Yeah, just pretend that's an appraisal. So I think I'm maybe losing the narrative here. I think here we probably need the ability of adding our own annotations, so our own findings.  That's not currently displayed anywhere. These are only the AI findings. But then we can generate the workbook from that or regenerate it.  From the workbook itself, there probably should be the ability to download a DocX version, and then you can do whatever you want with it, right?  Because it's exported out of the system. But the Cadillac version of that would be doing inline edits of the workbook itself in the platform.  And I think that makes sense too. And maybe if you could go to the workbook really quickly, Val, maybe the way to accomplish that is you have this nice visual version here that you can flip into the markdown version and just edit the copy to your heart's desire.  It's a bad idea.

29:51 - Edward Kruger (Realwired)
  think, like, to the other point, what we could probably do is also kind of, like, build some inline tools.  Like, because we know the sections that's going to come up. So maybe... So like on the property value summary, we have a little plus button that allows you to add a row if you want more information in there, or it allows you to delete a row.  And we could probably save that in the audit trail as well. But that's kind of like what I'm thinking.  Do you think that as well? Is that what you're seeing? So let's just go off to something that looks a little bit more familiar to us.  So let's just scroll down. Yeah, let's just use that comparable group. Yeah, okay. So this is something that's remarkable to us, right?  It's putting in comparables. So let's say we don't want comparable five because it's an outline. You know, just having the ability to know that this is the comparable group, so the action that you can take in mind, yes, delete.  You could have billing functionality as if it was a Word doc, almost. Effectively. Adding stuff, deleting stuff. Adding stuff, deleting stuff.  But we are focusing it on, like, I'm not asking you to do formatting and changing this to bold. You know, I'm not building formatting tools.  I'm building. I'm you. Tools specifically to the sections to allow you to modify the output. Quick question. What do you mean by workbook versus findings?  What's that separation?

31:11 - Val Vinnakota (brandcave.co)
  The findings reviews the source appraisal report, and it's annotating on top of that how the AI has approached in its findings.  Workbook is the output that we are presenting with our findings and how we have understood what should be the review, right?

31:30 - Edward Kruger (Realwired)
  Okay, I think that's probably just some language that we need to clean up, but effectively what we want to do is, you know, the workbook is the output, and probably what we'll attestate or kind of like, you know, validate or decide on is going to be the same information in that workbook.  We won't be like annotating it on the original appraisal. We will be annotating that in the output. Let me ask a dumb question.  Is there any way to... you. I know it's HTML, but probably not. Is there any way to go backwards and say it spits out and it's a, I don't know if a Word doc, but something that feels like a Word doc.  They move  around, they make all their edits free flow, and they click final, and it's in HTML? Or is that just double?  Totally.

32:20 - Cody Miles
  No, I mean, if we do it in Markdown, they can do whatever they want, and we can, you know, switch it to the HTML version.

32:26 - Edward Kruger (Realwired)
  I think it's the speed of cruising through charts and text. Like, agree with this, delete this, make this bigger, just try to stop, get rid of it, want to add something.  If you can give me that functionality, and then they're okay with it spitting out. It doesn't have to be live within the form.  It could be spit out to the pretty HTML, or it could be with the form, they don't care. Yeah.  I'm just trying to look back.

32:50 - Cody Miles
  Well, I think, I think to your point, I mean, that's just the difference between viewing the pretty HTML version and switching into the Markdown version to make whatever changes you want.  of know, Thank

33:00 - Edward Kruger (Realwired)
  think, Cody, the problem is with the markdown is that we won't be able to show the raw markdown, you know, because people don't understand that language, you know, so we'll have to show that in an editor.  Yeah, I mean, you'll have to use a WYSIWYG, but that's fine, you know.

33:14 - Cody Miles
  Basically, you're just changing, like, raw text, right, but you're using kind of a WYSIWYG experience for that, but you still can switch into an HTML version of that markdown.  Yeah. If I'm following what you're saying.

33:26 - Edward Kruger (Realwired)
  It's kind of like what I'm getting, but, you know, I don't know if it's somehow, it feels like a regression.  I feel like we're missing, you know. think we're missing the simplicity. It's got tons of functionality. It's just the challenge is their workflow is it introduces friction in their mind because they can't, they want to hurry up and get to the report.  And then once they've got the report, they want to hurry up and finish this thing.

33:52 - Cody Miles
  They want to aggregate those two things.

33:54 - Edward Kruger (Realwired)
  They don't live here and assume Parachute is right. They'll go, oh, wow. That looks like a lot. A of possibilities.  Let me now go do my work. Now I'm done. How do I hurry up and spit out the outcomes?  And then look at this. Got a lot of great stuff. It's really pretty, cool stuff. I don't want to have to do the same edits every same time.

34:17 - Cody Miles
  I guess the narrative I'm losing here, what we are demonstrating is upload appraisal, get a report, and that's the workbook, right?  And that's solving for what I understand to be kind of your 80% use case where it's like they just need to get the output from Parachute.  All the other features we're building around here are really for how I understand it to be like the 20% where they want to go back into the findings.  They want to change the findings. They want to change the format of the actual report that's being generated. You know, they want to go in and change the text of the report itself.  Do I understand that narrative correctly or where am I missing it? You said the 80% do what?

34:56 - Edward Kruger (Realwired)
  The 80% just want to throw their appraisal.

35:00 - Cody Miles
  Or their appraisal into Parachute and get the output, the report from Parachute.

35:08 - Edward Kruger (Realwired)
  And make very little changes, you mean? Yeah. They won't say that honestly, because that means they're not really – they have to prove they did something especially to a regulator.  That's why this is kind of an annoying issue. Right. But that's why we're leaving.

35:25 - Cody Miles
  You upload your appraisal, and then the first thing you see is the workbook, because that's solving for your, like, 80%.

35:33 - Edward Kruger (Realwired)
  Can you go back to – I think it's – can you scroll to the top of the – I think it's what you call a workbook?  Mm-hmm.

35:41 - Val Vinnakota (brandcave.co)
  Yeah.

35:42 - Edward Kruger (Realwired)
  So if I could cruise down – maybe that's what you're calling the online – and, again, just like a Word doc, if I could have a button within the box and go, yep, I concur, concur, concur, delete, reject, within this, live.  Mm-hmm. Yeah, so, you know, basically taking the finding section, you know, bringing that into this, you know, for each section, and then have the buttons in line.  I think that could solve actually good. Just crayons. I mean, if we have some other customers that want to have that functionality of moving  around and colors, fantastic.  For the majority, for the demos, I would not show them that because it's complicated. They're like, oh, so I have to just scroll down here and go, yes, yes, yes, no, no, delete, delete, I don't like this.  Oh, I like this. Like, for example, let's say this third one, I click a button, just says edit. I go into edit, I like what it said, but I'm going to reword it, similar thoughts, blah, blah, blah, blah, blah, boom, done.  And then it shows that I did touch things because the program will somehow show that I click the buttons.  That's a good idea. Yeah, and to me, that's like, you know, word doc. So you're, the point is. Because gun to head, I started that first page and I get to page six.  If I can go, as opposed to, you know, over here on the right, I feel like I'm floating away and working on HubSpot, CRO kind of feel.  Right, right. If you rephrase it. Too much information. Well, again, I think there's a 20% that want all that, but everybody else is going to want it.  I want to save time, Jeff. I got that over and over today on the second bank I talked to.  They're getting to the minutiae of, like, hey, Jeff, we have a button and you connect to where all our compliance checklists, you automatically invoice us.  I don't want to have to click a button. I'm like, seriously? Wow. And I haven't been part of a product, people.  But that's a level of saving time. So that's why I love, if you stay in a workbook, delete, add,  done.  Which includes entire sections, like let's say scroll back up, scroll back down, right there. Let's say I didn't want, for whatever reason, let's just say I didn't want that adjusted comparable thingy, and I could just, it's a box, I could just delete it.  Cool. Move on. Next. You know, the thing, that looks great. I want to keep that. Or I want to keep it, but the sentence underneath it, the cap rate, that red one where it says selected, I love that section.  I'm going to edit that text that's underneath it, perfect, done, safe, go next. As opposed to, I don't know what you call this, stuff on the right, know, the on, the offs, kind of the cloudy style, high level manipulation of the output.  Yeah. But again, I we're dealing with HTML, so I'm not sure how it inline. No, we can do that.  It's not, it's not the end of the world. We can do that. Okay, that's an interesting challenge. It'd be interesting to get a down and dirty in line for me to play with, even if it's super as ugly and doesn't even work altogether.  If you could just, so I can get that feeling of speed, I could go, oh, yeah, this is it for 80% of Fath Client Base.

39:18 - Cody Miles
  I mean, what I think I'm picking up here, Jeff, so I just want to repeat it to make sure I'm not misunderstanding, but from the workbook itself, we just want the ability to very quickly edit without trying to get into the minutia of this right sidebar, kind of thing, right?  Like we want to be able to delete a section by like hovering over the section and deleting it or edit the section as we want, right?  And being able to edit the findings from here as well. So being able to edit the findings into the other place where we show the findings, I think is cool because we show it in the context of the appraisal.  Like here's the finding, here's the place in the appraisal that like triggered that finding. Here's the citation around it.  think that seems useful, but that's for your 20%, right?

40:00 - Edward Kruger (Realwired)
  Yeah, I think the majority is the format that your latest, like the data center. I think they liked the format.  Originally, we had too much data. It was like 15 pages. So a lot of it was redundant. We got it down to five or six or seven pages, and that works very well because their thinking is, if you have 15 pages, you're creating more work for me.  I have to read this entire parachute thing, then open up this 200-page book and worry about, you know, is this stuff right?  But if I have a five-page or a really high level of good share, that's fantastic because I can read it.  Now, when I open up the appraisal, I feel like I'm primed. I'm ready to go. So as we shrunk it, that was really accepted way better than more stuff.  So we got rid of the redundancy. We did the yellows and reds. That's a nice little touch between, you know, the yellows I might disagree with.  The ones I probably would agree with or not. Because in this world of reviewers, here's the scale. You've got somebody that goes to an appraisal and superficially as a reviewer, it's like, yeah, I probably would handle it differently.  That's okay. That's okay. That's okay. That's okay. On the other end of the spectrum, we call them a gotcha reviewers.  They're just going to shred it. I need more support for this. I don't agree with this. You should have done this.  And they just beat the  out of their appraisal. So you give them a tool, you're kind of emboldening both of those people, which is not just violence, human nature.  You're going to embolden the gotcha person to probably be a little bit more of a prick because they might catch more stuff.  And the other person who's not as good, the good part is you're training younger reviewers that don't quite know what they're doing.  You're also maybe training laziness, how they over-index on parachute and go, you know, it spits out the workbook. Yep, all good.  Well, if they don't say something, you have no idea. Does your boss. Did you even read this on real?  Or did Pura shoot just spit this  out? Looks good. Right. Right. So that's why it's a weird kind of compromise the functionality that we're getting to.  Okay. Okay.

42:18 - Cody Miles
  You used the HubSpot builder experience as a design analogy, if I heard that correctly. And I could see that being applied here.  So we can use that as a design reference for how we approach this.

42:33 - Edward Kruger (Realwired)
  Could you just run me through that? Because I'm not so familiar with like how HubSpot does it. Yeah. Yeah.

42:41 - Cody Miles
  Let me see if I can pull up an example real quick. And I assume you and I are talking about the same thing, Jeff.  But just let me know. Let me get into one of these accounts real quick. We'll do... Guys, I'll use their email builder.  If I create a new email, so do you see how like each section is highlightable? And then I can select that to get into like an edit state here to, you know, make my changes.  I can do text in line, sort of thing. Or, you know, I could even add in a new section here.

43:36 - Edward Kruger (Realwired)
  Are you thinking about the annotation on the left column? That style, is that what you're saying?

43:43 - Cody Miles
  Well, I'm mostly thinking about the center part here, where imagine this is our workbook that gets spit out, right?  But the user, we want the user to have control over, you know, what's actually happening in here. So what I'm showing is like highlight a section.

43:59 - Edward Kruger (Realwired)
  I can rearrange the section.

44:00 - Cody Miles
  I I want to, I can edit the section if I want to, that changes what's happening here. I can duplicate the section, can hide the section.  I think that's definitely the pattern.

44:12 - Edward Kruger (Realwired)
  You know, what we just would need to be careful of this is like, you know, for me it's, let's make sure that the controls are very visible and context orientated, you know, for where we are.  So, for example, on that table, it's add a row, delete a row, you know, or maybe edit the content, you know, and same for the comps, you know, completely or put it in or whatever the scenario might be.  But I think it's, what I don't want it to be, because we'll run into the same problem the next iteration is where you select the box and you get the grid on the left and it's now like, well.  Oh yeah, it's like so much, it's way too much. Yeah. Yeah.

44:54 - Cody Miles
  Yeah. I hear that for sure. We keep it simple, give them the ability to edit things, repeater patterns, you should be.  We had a row, delete a row, edit the row.

45:02 - Edward Kruger (Realwired)
  Yeah. And what additional functionality is, let's say I went through a report like that you just did, deleted, moved around, stuck in a logo.  They're going to want to one time save it. Yeah, the different thing. If they moved from section two to section one, the next time they do it, I already got this feedback.  Joe, we don't want to keep manipulating your output, doing the same thing, the same edits every time, Holly. Yep, gotcha.  Yep, okay, got it.

45:30 - Cody Miles
  Cool. Okay, I think I get it.

45:36 - Edward Kruger (Realwired)
  It's really...

45:38 - Cody Miles
  What's that? It's a little surprising.

45:42 - Edward Kruger (Realwired)
  For me to get it? No, no, no. No, the simplicity of... Because we went through this journey with them a year ago, they were like, I'm not interested in AI.  Nine months ago, it was like, hallucinations in this review world is not acceptable in a regulatory environment. Ethyst, a for us.  Yeah. Thank Six months ago, it says we have to do something AI. Four months ago, it was like, oh, holy , this is good .  And now, I've raced ahead to the format. So, I thought it would be AI-related. It's all about this. They're like, Jeff, I don't, I just want to, I'm like, seriously?  Is that what it's, it's alpha? So, this is very important relative to, you know, and you guys are fantastic designers, is use crayons.  Yeah. You can't screw it up. You're going give it to a five-year-old and say, hey, can you change this parachute output?  Yeah. I mean, really, it's literally that approach of, if I gave you 30 seconds to finish this review, knowing that you read the report, could you fix this stuff in two minutes?  It's pretty good. It's that kind of approach.

46:47 - Cody Miles
  You know, though, if I were building this product, Jeff, the way I would probably approach it would be everything that's been done until now.  That's probably your new phase one, because you already have something out there. So, call this one phase two, maybe.  But then all of the... The inline stuff, I'd probably do as a follow-up phase because it's much more difficult, right?

47:06 - Edward Kruger (Realwired)
  Problem is, so for this, we want to launch for general availability. So the current version that we have is you pump it through the system, you get the output, you need to be a Uconnect customer.  This allows the platform process into it. This doesn't work if we don't have the inline needed.

47:27 - Cody Miles
  Well, the way I was, what I didn't say, but what I probably should have said, if they were to accept this phase two and you take the inline part out of it, provide the ability of exporting docx, and then you can do however many changes you want.  You just have to do them outside of the system and in your normal way that you're used to working.

47:47 - Edward Kruger (Realwired)
  So the thing is, is the document is currently available as docx, you know, so they can't currently do it, but they don't, you know, it's the whole thing.  And then the copy and paste that the compliant days is that. They do open it up with Word, and now they don't like that one sentence, but deleting that row now  up the entire form.  I see. Okay. Okay.

48:08 - Cody Miles
  Okay.

48:09 - Edward Kruger (Realwired)
  Yeah, I think in the short, short term, we can get away with it, and they can figure awkwardly how to manipulate their workflow.  Right. I have to copy this to my Word doc or whatever they're doing, because this is just, the questions I'm getting is, Jeff, how do I get going using this?  Yeah. I tend to get stuck, but so it's a sooner rather than later. Yeah. I think we can get away with what we're doing, because we're switching from POC to contracts, and we have one person, she's like, oh, it's amazing, but I see where you guys are going with this, but I'll wait until you guys finish this.  Yeah, sure, sure. Okay.

48:50 - Cody Miles
  Okay, so what we're saying is the next version absolutely needs the inline editing in probably the HubSpot style that I just showed for the Word.  Workbook itself, and we want to keep it as simple as possible. It's just a WYSIWYG editor in line, but for things like repeater patterns, table rows, add a row, delete a row.

49:12 - Edward Kruger (Realwired)
  Yeah, and I think that's important also just this distinction that we don't disagree or corroborate with the findings in the source document.  The source is the truth. If, you know, we do it in the workbook, we're saying this paragraph came from page 64, this is the information associated with it.  Do you want to keep it or remove it or reject it or whatever, but effectively working through it from a section-to-section perspective.

49:40 - Cody Miles
  Okay. Can you make this real quick?

49:42 - Edward Kruger (Realwired)
  Maybe I'm not understanding. So what, yes, so that's exactly what they did. So if you kind of like look at findings, you'll see that this changed to the source documentation.  So it's saying. Where I got it. It's saying that this is where got it, and then, you know, you cannot change that, which will change.  So it was kind of like going to the source to manipulate. So you're saying keep this and then the workbook do the online?  I'm saying that you can't change or disagree or anything with the source because the source is in the tree.  When you go to the findings. So effectively the findings go away, the findings get merged into the workbook. The findings should be what batter should have found, the derived output of the source document.
  ACTION ITEM: Draft plan for inline workbook editing (HubSpot-style); send async video updates to Jeff - WATCH: https://fathom.video/share/ZGwg-yfxrjX1MJzXwn5BcaejzjHwu6zZ?timestamp=3030.9999  Which is your typical output. That should be the findings, not source linked findings. it's still five, six, seven, eight.
  ACTION ITEM: Draft plan for inline workbook editing (HubSpot-style); send async video updates to Jeff - WATCH: https://fathom.video/share/ZGwg-yfxrjX1MJzXwn5BcaejzjHwu6zZ?timestamp=3030.9999  sure. Exactly. Yeah, we're not changing anything. Cool. Okay.

50:41 - Cody Miles
  Well, let me kind of regroup with Val and... Thank you. ...create a plan and I'm trying to get this delivered ASAP.  Yeah.

50:49 - Edward Kruger (Realwired)
  Cody, do you think this week we'll see a version of it? Even if it's just, it doesn't need to be a wonderful like, you know, if we can just drift from it.  If you have an idea and we can refer on it, that's enough.

51:03 - Cody Miles
  Yeah, let's do this because I want to deliver this quickly. We'll provide async video updates just for asking for feedback on ideas as quickly as possible.  And then we'll just spike. We'll just do more hours this week than maybe next week or the week after just to get it done.

51:23 - Edward Kruger (Realwired)
  Appreciate it. A little closer. Yeah. little parachute. Yeah, I like the parachute motif, yeah.

51:32 - Val Vinnakota (brandcave.co)
  Oh, nice.

51:33 - Edward Kruger (Realwired)
  Okay. Nice. Super cool. Okay, thanks, Steve. Thanks, guys. for that. Thanks, guys. Appreciate it. See ya. I can go to the end.