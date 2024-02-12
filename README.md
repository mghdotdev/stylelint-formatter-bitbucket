# stylelint-formatter-bitbucket

A stylelint formatter that uploads results as a report to Bitbucket.

Inspired by https://github.com/Sleavely/eslint-formatter-bitbucket

## Usage

```
[npm|pnpm] install -D stylelint-formatter-bitbucket
```

Add a linting step `bitbucket-piplines.yml`:

```
pipelines:
  pull-requests:
    '**':
      - step:
          name: stylelint
          script:
            - npx stylelint --custom-formatter node_modules/stylelint-formatter-bitbucket **/*.css
```

### Outside of Bitbucket Pipelines

If you are running the formatter in a context outside of Bitbucket Pipelines, for example from a local environment or in a custom CI provider, you'll need to set some environment variables manually:

* `BITBUCKET_API_AUTH` - the value for the "Authorization" header when communicating with the [Bitbucket API](https://developer.atlassian.com/cloud/bitbucket/rest/intro/#authentication), e.g. `Bearer my_access_token`
* `BITBUCKET_COMMIT` - commit SHA for the current run, e.g. `a624d1419b98`
* `BITBUCKET_WORKSPACE` - e.g. `mghdotdev`
* `BITBUCKET_REPO_SLUG` - URL-friendly repo name, e.g. `stylelint-formatter-bitbucket`

## License

See [LICENSE](./LICENSE)
