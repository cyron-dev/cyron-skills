# Review manifest

The generator accepts UTF-8 JSON. Relative file paths resolve from the manifest directory.

```json
{
  "title": "Environment review",
  "run_id": "environment-review-01",
  "project_root": "C:/Projects/Unity/SampleGame",
  "unity_version": "6000.5.5f1",
  "review_kind": "visual",
  "summary": "Four approved environment camera positions.",
  "evidence": [
    {
      "id": "SpawnView",
      "title": "Spawn view",
      "image_path": "captures/SpawnView.png",
      "scene_path": "Assets/Scenes/Main.unity",
      "scene_guid": "0123456789abcdef0123456789abcdef",
      "camera": "MainScene/ReviewCameras/SpawnView",
      "global_object_id": "GlobalObjectId_V1-...",
      "frame": 1842,
      "time_seconds": 30.417,
      "test_case": "Namespace.Fixture.Case",
      "log_reference": "player.log:812",
      "details": {
        "state": "WorldReady",
        "resolution": "1920x1080"
      },
      "source_files": [
        {
          "path": "captures/SpawnView.png",
          "sha256": "OPTIONAL_EXPECTED_HASH"
        },
        {
          "path": "results.xml"
        }
      ]
    }
  ]
}
```

## Required fields

- Top level: `title`, `run_id`, `review_kind`, and a nonempty `evidence` array.
- Evidence item: unique `id` and `title`.

## Optional evidence fields

- Visual: `image_path`, `scene_path`, `scene_guid`, `camera`, `global_object_id`.
- Runtime: `frame`, `time_seconds`, `test_case`, `log_reference`, `details`.
- Structural: put asset GUID, fileID, component type, property path, Build Settings entry, and owner evidence in `details`.
- Files: `source_files` accepts strings or objects with `path` and optional `sha256`.

The generator calculates every source-file hash. A supplied expected hash must match or generation fails.
