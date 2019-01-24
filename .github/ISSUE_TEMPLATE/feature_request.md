---
name: Feature request
about: Suggest an idea for this project

---

**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is. Ex.

It would be nice to not have to specify foobar.com twice:

```yml
version: 2
requests:
  foobar.com:
    request:
      url: https://foobar.com/get
      method: GET
```

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

Example:

Allow request name to be used as a parameter as below:

```yml
version: 2
requests:
  foobar.com:
    request:
      url: https://<$ RequestName() $>/get
      method: GET
```

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.
