---
title: "The Semantic Ratchet: Let the Compiler Remember"
description: "Preserve established facts in types so humans and AI agents need fewer guesses and invalid programs fail earlier."
date: 2026-10-16
layout: post.njk
tags: ["type-safe", "design", "AI", "Kotlin"]
permalink: /posts/semantic-ratchet/
---

When a program establishes a fact, its representation must preserve that fact wherever later behavior needs it.
That is the **Semantic Ratchet**.
A parser produces a stronger value.
A consumer accepts that value.
The next operation starts with the knowledge that the previous operation established.

This principle matters for humans and AI agents alike.
A comment asks the next author to remember a rule.
A constrained type lets the compiler reject a call that breaks the rule.

Language models generate plausible continuations from context.
Ambiguous identifiers, hidden invariants, nullable fields, and convention-dependent APIs leave more interpretations open.
The author must infer which interpretation matches the domain.

More context can help.
Prompts, repository summaries, examples, and memory can explain intent.
For facts the program already establishes, an enforced contract can preserve that intent across callers and edits.

## Reduce the state space

Consider this interface:

```kotlin
fun sendReceipt(customerId: String, email: String)
```

A caller can reverse the arguments or pass an unrelated string.
Those calls remain type-correct.

Now give each concept a distinct type:

```kotlin
fun sendReceipt(
    customerId: CustomerId,
    email: EmailAddress,
)
```

The compiler rejects swapped arguments.
It does not prove that the caller chose the correct customer or address.
Distinct types remove one specific mistake from the set of accepted programs.

Names alone establish no validity constraint.
A type alias creates no distinct type.
An unchecked wrapper accepts the same invalid input under a new name.
An `EmailAddress` needs controlled construction under an explicit address policy.
Even then, valid syntax proves neither mailbox ownership nor delivery.

Use the smallest representation that excludes the named mistake.
A finite choice can use an enum.
A case with its own data can use a sealed hierarchy.
A non-empty collection can store a head and a tail.
A numeric range can use a constrained constructor.

The useful question is precise: which incorrect program will this representation reject?

## Make the program remember

Many designs establish facts and then discard them:

- A validator accepts an email, but consumers still receive a `String`.
- Authentication establishes identity, but consumers still receive an ordinary request.
- A service establishes eligibility, but consumers still receive a generic account.

The representation leaves later callers responsible for the earlier reasoning.
Alexis King's [Parse, don't validate](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/)
describes how a stronger result preserves that knowledge.

For example, a page size must lie between 1 and 100.
This Kotlin example gives that rule one owner:

```kotlin
@JvmInline
value class PageSize private constructor(private val count: Int) {
    fun <T> takeFrom(items: List<T>): List<T> = items.take(count)

    companion object {
        fun parse(raw: Int): PageSizeParse =
            if (raw in 1..100) {
                PageSizeParse.Accepted(PageSize(raw))
            } else {
                PageSizeParse.OutOfRange(raw)
            }
    }
}

sealed interface PageSizeParse {
    data class Accepted(val size: PageSize) : PageSizeParse
    data class OutOfRange(val supplied: Int) : PageSizeParse
}
```

The parser accepts an external integer.
Success carries a `PageSize`.
Rejection carries the supplied integer in a distinct case.
Expected failure needs no exception, nullable sentinel, or unexplained Boolean.

A consumer carries the stronger value forward:

```kotlin
fun <T> firstPage(items: List<T>, size: PageSize): List<T> =
    size.takeFrom(items)
```

`firstPage(items, 0)` fails to compile.
`PageSize(0)` also fails because the constructor is private.
The parser rejects both 0 and 101.
It accepts both 1 and 100.
These cases exercise different obligations: the compiler controls calls, while runtime assertions examine the parser's rule.

The compiler does not prove that the parser implements the intended range.
A private constructor controls access to the implementation that establishes the fact.
That implementation still needs review and executable evidence.

<figure class="ratchet-figure">
  <img src="/posts/semantic-ratchet/preserve-facts.svg" width="480" height="450" alt="An untrusted integer enters a parser. Success carries PageSize to firstPage. Rejection carries OutOfRange to the caller.">
  <figcaption>The parser establishes the range. The consumer accepts the value that preserves it.</figcaption>
</figure>

## Close the expected outcomes

`PageSizeParse` also closes the set of expected outcomes.
A consumer handles each case explicitly:

```kotlin
fun describe(result: PageSizeParse): String = when (result) {
    is PageSizeParse.Accepted -> "Page size accepted"
    is PageSizeParse.OutOfRange -> "Outside 1..100: ${result.supplied}"
}
```

Kotlin's [sealed hierarchies](https://kotlinlang.org/docs/sealed-classes.html#use-sealed-classes-with-when-expression)
let the compiler examine whether this `when` expression covers every case.
If the hierarchy gains another case, this expression must handle it before compilation succeeds.
An `else` branch removes that signal.

Each case needs exactly the data that its meaning demands.
A payment approval carries its receipt.
A decline carries its reason.
A demand for further action carries that action.
A status string with optional fields permits combinations that the domain rejects.

A closed internal model does not close an external service's vocabulary.
An adapter must handle unknown external values explicitly.
It must preserve uncertainty or reject the input without inventing a successful domain value.

## Preserve facts through each phase

Compilers provide a useful model for this design.
A compiler can resolve a name to a declaration and preserve that identity in later representations.
Later phases then consume the resolved identity instead of guessing from the spelling.

<figure class="ratchet-figure">
  <img src="/posts/semantic-ratchet/compiler-phases.svg" width="480" height="510" alt="Source becomes a syntax tree, then resolved symbols, then typed operations, then executable code. Each phase preserves facts for later work.">
  <figcaption>This conceptual compiler pipeline shows how later phases consume earlier decisions.</figcaption>
</figure>

Application code can use the same progression.
Raw input becomes parsed intent.
Authentication establishes a principal.
Authorization produces a capability for a particular action and resource.
The operation accepts that capability rather than an unrelated Boolean and a separate resource.

The capability's meaning depends on its construction and scope.
It must bind the principal, action, resource, and version or lifetime that the policy needs.
A capability for one document does not authorize another document.

External facts can change.
A permission can expire, and another transaction can change an account.
The effect adapter must establish freshness where the operation needs it.
Ordinary Kotlin types do not prove single use, prevent capability reuse, or establish transaction isolation.

Keep pure decisions separate from filesystem, network, clock, and database effects.
Pass effect results into the core as explicit values.
Keep each expected failure distinct when callers need a different response.
Serialize domain values at transport adapters instead of reducing internal contracts to strings and maps.

## Use compiler facts within their scope

A model can choose the wrong overload, examine the wrong implementation, and propose a coherent change to the wrong path.
A compiler-derived symbol identity can eliminate that specific guess.

Use semantic tools for symbol identity, resolved types, references, and relationships that the tool can establish.
Inspect the tool's scope and completeness before treating a result as authoritative.
Dynamic dispatch, reflection, generated code, and runtime configuration can leave relationships unresolved.
An empty result does not prove absence when coverage is incomplete.

The model can decompose intent and compose candidate changes.
Compiler evidence constrains claims about the program.
Runtime evidence establishes what an external interaction actually did.
Each source of evidence answers a different question.

<figure class="ratchet-figure">
  <img src="/posts/semantic-ratchet/feedback-loop.svg" width="480" height="520" alt="Intent and source evidence inform a candidate change. Compiler, schema, and behavioral checks reject violations. Accepted candidates still need review and evidence for external effects.">
  <figcaption>Precise rejection guides the next candidate. Acceptance remains limited to the obligations that the tools examine.</figcaption>
</figure>

## Design for precise rejection

AI-assisted work makes repeatable feedback valuable because each proposed change needs a decision about correctness.
Faster generation does not remove that decision.
It gives an implicit rule more opportunities to disappear from the next candidate.
A prompt can describe an invariant.
A compiler, schema, database constraint, or focused behavioral assertion can reject a candidate that violates an encoded rule.

These mechanisms prove different things.
Compilation establishes the encoded type obligations.
A schema establishes declared payload constraints.
A behavioral assertion compares an actual result with an independently chosen expectation.
None proves complete correctness.

For each ratchet, name the fact, its owner, its construction path, its consumer, and the forbidden call or transition.
Then exercise one legal path and the nearest invalid case.
For `PageSize`, keep the accepted endpoints, rejected neighbors, private-constructor rejection, raw-integer rejection, and incomplete-`when` rejection as separate evidence.

Do not weaken the contract to silence the feedback.
A cast, unchecked factory, catch-all branch, or premature conversion to a primitive can erase the fact that the design needs.
When a rule changes, change its owner and repair the consumers that the compiler identifies.

This discipline does not need a type for every local predicate.
A fact that never leaves one small function can stay local.
A fact that later behavior needs must survive the journey to that behavior.

The value of the Semantic Ratchet is that each established fact reduces the reasoning that every later author must repeat.
That author can be a maintainer, a new teammate, or an AI agent.

## Further reading

- Alexis King, [Parse, don't validate](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/).
- Alexis King, [Names are not type safety](https://lexi-lambda.github.io/blog/2020/11/01/names-are-not-type-safety/).
- Kotlin documentation, [Inline value classes](https://kotlinlang.org/docs/inline-classes.html) and [Sealed classes and interfaces](https://kotlinlang.org/docs/sealed-classes.html).
