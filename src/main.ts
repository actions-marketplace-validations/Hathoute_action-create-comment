import * as github from '@actions/github';
import * as core from '@actions/core';

async function run(): Promise<void> {
  try {
    const githubToken = core.getInput('github_token', { required: true });
    const body = core.getInput('body', { required: true });

    const octokit = github.getOctokit(githubToken);

    let { owner, repo } = github.context.repo;
    if (core.getInput('repo')) {
      [owner, repo] = core.getInput('repo').split('/');
    }

    const commentUid = core.getInput('comment_uid') === ''
      ? undefined
        : parseInt(core.getInput('comment_uid'));

    const pullNumber =
        core.getInput('number') === ''
            ? github.context.issue.number
            : parseInt(core.getInput('number'));

    let githubCommentId = null;
    if (commentUid == undefined) {
      await octokit.issues.listComments({
        owner,
        repo,
        issue_number: pullNumber
      }).then(payload => payload.data.filter(c => c.body.includes(`cid=${commentUid})`)))
          .then(comments => comments.map(c => c.id))
          .then(cid => githubCommentId = cid)
    }

    const commentBody = createCommentBody(body, commentUid);
    if (githubCommentId == null) {
      await octokit.issues.createComment({
        owner,
        repo,
        issue_number: pullNumber,
        body: commentBody
      });
    }
    else {
      await octokit.issues.updateComment({
        owner,
        repo,
        comment_id: githubCommentId,
        body: commentBody
      });
    }
  } catch (e) {
    core.error(e);
    core.setFailed(e.message);
  }
}

function createCommentBody(body: string, commentUid?: number) : string {
  if (commentUid == undefined) {
    return body;
  }

  return body + `\n\n[This comment is auto-generated](https://github.com/Hathoute/action-create-comment?cuid=${commentUid})`;
}

run();
