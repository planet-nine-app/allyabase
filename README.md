# allyabase

![All your base are belong to us](https://github.com/planet-nine-app/allyabase/blob/main/site/images/all-your-base.jpg)

**allyabase** (named for an early oughts internet meme, which featured the quirkily translated game Zero Wing) is a playful jab at the BaaS (backend as a service) platforms in name, and a serious attempt at providing public backend infrastructure in form.
In addition to referencing a time when the internet was weirder, it is meant as a (playful) reminder that BaaS is a thinly veiled data collecting mechanism where you get to pay for the privelage of handing your user's habits to advertisers for them to profit off of.

allyabase wants to be a free, open source, self-hostable alternative to whatever other bases may be out there. 

### An aside on what's all going on here

allyabase is a collection of miniservices[^1], which utilize the [Sessionless][sessionless] protocol (SLAP).
SLAP allows, among other things, for clients to authenticate without sharing any personal information like an email or password.
One of the most interesting things that this does is it lets you authenticate with the miniservices directly in the same or different ways from different clients.

At the risk of being hyperbolic, this enables [interoperability][ht1].
If that were all this was about, it'd probably be enough for me to want to work on it. 
But as it happens, you can build some really cool stuff once you no longer have to worry about user's info and credentials. 

At the end of the day, though, someone's gonna have to pay to host this stuff somewhere, and for it to actually keep working as it scales, that's going to get expensive.
So what I want to do is work on getting it so that folks can run these miniservices on computers that already sit in their house like routers, and smart tvs, and then pay them a bit of the transactions that flow through them.
Because if no one is ever going to bother to make a printer that works, we can at least make it so you get five bucks a month for sitting on a table taunting you[^2].

### Overview

allyabase is a collection of seven miniservices.
Each miniservice provides at most two main functions.
Those functions will be discussed in brief here, with links to their API documentation.

[Addie][addie]: The accountant of the miniservices. Handles splitting up transactions, and signing people up for processors.

[BDO][bdo]: Sometimes you just need to store a Big Dumb Object

[Continuebee][continuebee]: Saves and checks client state to verify local state matches expected state.

[Fount][fount]: Ok, so there's this thing called [MAGIC][magic], and you don't really need to know about it, but it allows you to do the whole linking people together for transactions (both with money and not money). And along with this you can do some other rewards.

[Joan][joan]: Account recovery without having to do a bunch of stuff.

[Julia][julia]: Peer to peer associations for messaging, and coming soon for intra client assciating.

[Pref][pref]: Stored preferences (or any key/value pair really). Also allows for global preferences across clients.

### Tech Stack

allyabase is meant to be multi-language, and multi-platform. 
Anyone is free to take this doc as a reference and implement their own implementation in their own preferred language.
You may contribute that effort back to this repo for the benefit of others, or not.

The initial services in the linked repos have been written in JavaScript, because, like it or not, JavaScript is the closest we have to a _lingua franca_[ht2] in the programming world. 
The only dependencies are `express`, `sessionless-node`, and sometimes `node-fetch`.
For the datalayer, these reference implementations simply write to the file system.[^3]

For an example of a repo with multiple implementations, checkout the TypeScript and Java servers in [Continuebee][continuebee].

### Client SDKs

Right now the client SDKs are being built into products that are being built using Sessionless and parts of allyabase. 
For the open source Swift example you can checkout [JuliaChat][juliachat].
Kotlin or Java will come after that.
The JavaScript one should hopefully be done before anyone reads this, but if not, just know it's coming soon.

### Roadmap

allyabase is meant to be _interoperable_ with any service that utilizes public key cryptography using the secp256k1 curve, so it's well within reason that things may be built adjacent to allyabase, which aren't officially part of allyabase, and this roadmap should neither be considered restrictive nor exhaustive.

* prof: pref, but for profiles

* locus: geo data

* TCB: tasks/todos/reminders/etc

### Contributing

Each miniservice has its own contributing guide. 
Should you want to make a contribution to a servie, you should check there.

If you'd like to add an allyabase client, you should submit a PR with a video of you testing all the methods of the client against the dev instance of allyabase.

### Open Source Force

This project would not be possible without the support and contributions of the excellent people of Open Source Force. 

[sessionless]: https://www.github.com/planet-nine-app/sessionless
[magic]: https://www.github.com/planet-nine-app/magic
[addie]: https://www.github.com/planet-nine-app/addie
[bdo]: https://www.github.com/planet-nine-app/bdo
[continuebee]: https://www.github.com/planet-nine-app/continuebee
[fount]: https://www.github.com/planet-nine-app/fount
[joan]: https://www.github.com/planet-nine-app/joan
[julia]: https://www.github.com/planet-nine-app/julia
[pref]: https://www.github.com/planet-nine-app/pref
[juliachat]: https://www.github.com/planet-nine-app/JuliaChat

[ht1]: "In the hierarchy of non-centralized systems it goes decentralized (like blockchain), then federated (like the Fediverse), then interoperable (like cellular networks, or the world wide web). Interoperability was actually the norm in the years before the internet. You don't have to have different pens for different notebooks."
[ht2]: "A bridge language. Like common in DnD. 

[^1]: "I avoid using the term microservices here because a) they've sort of fallen out of favor, and b) because the allyabase miniservices (and miniservices that may be outside of allyabase) are much more stand alone because of how auth works for them."
[^2]: "The potential socioeconomic implications of a public cloud of this sort will be discussed in another doc soon."
[^3]: "I originally started out with Redis, but Redis isn't free, and so that kind of defeated the purpose of using it. After doing some more digging for a database solution, I was leaning towards sql-lite, but after feeling how lightweight everything was, it felt like adding a bunch of steps to install a database here and there undermined the spirit of the endeavor."
