Build a simple, clean, beginner-friendly **frontend-only website** for a **Physics SLA Assignment**.

## Project Title

**Physics Measurement Lab — Vernier Caliper, Screw Gauge & Spherometer**

## Important Constraints

* Build **frontend only**.
* Use **plain HTML, CSS, and vanilla JavaScript**.
* Do NOT use React, Vue, Angular, Node.js, PHP, databases, APIs, or any backend.
* No login/signup system.
* No external database or server-side functionality.
* The website must work by simply opening `index.html` in a browser.
* Keep the code simple, readable, and suitable for a school/college Physics SLA assignment.
* Use separate files:

  * `index.html`
  * `style.css`
  * `script.js`
* Do not over-engineer the project.

## Website Purpose

The website should allow students to calculate readings for three Physics instruments:

1. **Vernier Caliper**
2. **Screw Gauge**
3. **Spherometer**

Each calculator should allow the user to enter the required measurements and **zero error**, then calculate the corrected reading.

---

# 1. Home Page / Header

Create a simple header containing:

**Physics Measurement Lab**

Subtitle:

**SLA Assignment — Measurement Using Vernier Caliper, Screw Gauge & Spherometer**

Add a short introductory paragraph explaining that the website calculates experimental readings while taking instrument zero error into account.

Add three navigation buttons/cards:

* Vernier Caliper
* Screw Gauge
* Spherometer

Clicking each should scroll to its respective calculator section.

---

# 2. Vernier Caliper Calculator

Create a calculator card titled:

**Vernier Caliper**

Include input fields for:

* Main Scale Reading (MSR)
* Vernier Coincidence / Vernier Scale Reading (VSR)
* Least Count
* Zero Error

Use the standard calculation:

**Observed Reading = MSR + (VSR × Least Count)**

Then apply zero-error correction:

**Corrected Reading = Observed Reading − Zero Error**

Show the calculation clearly after pressing a **Calculate** button.

Example output format:

> Main Scale Reading = 2.30 cm
> Vernier Reading = 6
> Least Count = 0.01 cm
> Zero Error = +0.02 cm
>
> Observed Reading = 2.30 + (6 × 0.01)
> Observed Reading = 2.36 cm
>
> Corrected Reading = 2.36 − 0.02
> **Corrected Reading = 2.34 cm**

Also add a **Reset** button.

---

# 3. Screw Gauge Calculator

Create a calculator card titled:

**Screw Gauge**

Include input fields for:

* Pitch
* Number of Circular Scale Divisions
* Main Scale Reading / Pitch Scale Reading
* Circular Scale Reading
* Zero Error

Calculate Least Count automatically:

**Least Count = Pitch / Number of Circular Scale Divisions**

Then calculate:

**Observed Reading = Main Scale Reading + (Circular Scale Reading × Least Count)**

Then:

**Corrected Reading = Observed Reading − Zero Error**

Display all intermediate calculations.

Example:

> Pitch = 1 mm
> Circular Scale Divisions = 100
> Least Count = 1 / 100 = 0.01 mm
>
> Main Scale Reading = 5 mm
> Circular Scale Reading = 25
>
> Observed Reading = 5 + (25 × 0.01)
> Observed Reading = 5.25 mm
>
> Zero Error = +0.02 mm
> Corrected Reading = 5.25 − 0.02
> **Corrected Reading = 5.23 mm**

Add **Calculate** and **Reset** buttons.

---

# 4. Spherometer Calculator

Create a calculator card titled:

**Spherometer**

Include input fields for:

* Pitch
* Number of Circular Scale Divisions
* Main Scale Reading
* Circular Scale Reading
* Zero Error

Calculate Least Count:

**Least Count = Pitch / Number of Circular Scale Divisions**

Calculate the observed height/depth:

**Observed Reading = Main Scale Reading + (Circular Scale Reading × Least Count)**

Apply zero-error correction:

**Corrected Reading = Observed Reading − Zero Error**

Then use the corrected reading `h` to calculate the radius of curvature if the user provides the distance between the legs.

Add an input:

* Distance between the legs / Radius of the spherometer base (`l`)

Use:

**R = (l² / 6h) + (h / 2)**

where:

* `R` = Radius of curvature
* `l` = distance between the legs
* `h` = corrected spherometer reading

Show the complete calculation step-by-step.

Example:

> Pitch = 1 mm
> Circular Scale Divisions = 100
> Least Count = 0.01 mm
> Main Scale Reading = 2 mm
> Circular Scale Reading = 30
>
> Observed Reading = 2 + (30 × 0.01)
> Observed Reading = 2.30 mm
>
> Zero Error = +0.05 mm
> Corrected Reading = 2.30 − 0.05
> **h = 2.25 mm**
>
> Distance between legs = 30 mm
>
> R = (30² / (6 × 2.25)) + (2.25 / 2)
>
> Display the final radius of curvature clearly.

Make sure the units are consistent. The user should be able to select or understand the units being used.

---

# 5. Zero Error Handling

Zero error is an important part of this assignment.

Make the UI clearly explain:

**Corrected Reading = Observed Reading − Zero Error**

Allow both positive and negative zero-error values.

For example:

* `+0.02` means positive zero error
* `-0.02` means negative zero error

The JavaScript must correctly handle both cases.

Do NOT simply take the absolute value of zero error.

---

# 6. UI / Design

Make the website look like a clean modern Physics laboratory website, but keep it simple.

Design requirements:

* White/light background
* Simple blue/indigo accent color
* Clean cards
* Rounded corners
* Subtle shadows
* Clear typography
* Good spacing
* Responsive layout
* Mobile-friendly
* Calculator inputs should be easy to understand
* Buttons should have hover effects
* Results should be visually highlighted

Avoid:

* Excessive animations
* Complex gradients
* Huge text
* Unnecessary libraries
* Overly complicated UI
* Stock images

Use simple CSS only.

---

# 7. Navigation

Add a simple navigation bar at the top:

**Physics Measurement Lab**

Links:

* Home
* Vernier Caliper
* Screw Gauge
* Spherometer

Navigation should smoothly scroll to each section.

---

# 8. Formula Display

Each calculator should have a small **Formula** section showing the relevant equations.

For example:

### Vernier Caliper

`Observed Reading = MSR + (VSR × Least Count)`

`Corrected Reading = Observed Reading − Zero Error`

### Screw Gauge

`Least Count = Pitch / Number of Divisions`

`Observed Reading = MSR + (CSR × Least Count)`

`Corrected Reading = Observed Reading − Zero Error`

### Spherometer

`Least Count = Pitch / Number of Divisions`

`h = Corrected Reading`

`R = (l² / 6h) + (h / 2)`

---

# 9. JavaScript Requirements

Write clean vanilla JavaScript.

The calculators must:

* Read values from input fields
* Validate that required fields contain valid numbers
* Display a friendly error if an invalid value is entered
* Perform the calculations correctly
* Handle positive, negative, and zero zero-error values
* Display intermediate calculations
* Round results to a sensible number of decimal places
* Have working Reset buttons
* Prevent division by zero where applicable
* Handle `h = 0` safely in the spherometer calculation

Do not use `eval()`.

---

# 10. Educational Information

Below each calculator, add a short section:

### What is a Vernier Caliper?

Briefly explain what it measures and the basic principle.

### What is a Screw Gauge?

Briefly explain what it measures and the basic principle.

### What is a Spherometer?

Briefly explain what it measures and the basic principle.

Keep these explanations short and student-friendly.

---

# 11. Footer

Add a simple footer:

**Physics SLA Assignment | Measurement Instruments**

You can also include:

**Built using HTML, CSS & JavaScript**

---

# 12. Code Quality

Provide the complete code for all three files:

1. `index.html`
2. `style.css`
3. `script.js`

Make sure all IDs/classes referenced by JavaScript actually exist in the HTML.

The final result should be immediately runnable by opening `index.html`.

Before giving the final code, mentally test all three calculators with sample values and make sure the formulas, zero-error correction, validation, reset buttons, and displayed results work correctly.

Again: **frontend only, plain HTML + CSS + vanilla JavaScript, no backend and no frameworks.**