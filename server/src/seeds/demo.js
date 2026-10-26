import { Note, Link } from "../models/index.js";
import { record } from "../services/noteService.js";
const topics = [
  [
    "Machine Learning",
    "ai,learning",
    "Learning patterns from examples",
    "Machine learning uses data to fit a model. Training, validation, and testing separate learning from evaluation.\n\n## A useful connection\nLearning improves when feedback is timely and examples are varied.",
    0,
  ],
  [
    "Neural Networks",
    "ai,learning",
    "Layers of small decisions",
    "Neural networks combine weighted connections and nonlinear activations. Gradient descent adjusts weights to reduce prediction error.\n\n- Inputs become representations\n- Layers compose simple transformations\n- Generalization matters more than memorization",
    0,
  ],
  [
    "Transformers",
    "ai,language",
    "Attention connects the context",
    "Transformers use attention to compare tokens and build contextual representations. Parallel processing makes training efficient. Positional information preserves sequence structure.",
    0,
  ],
  [
    "Large Language Models",
    "ai,language",
    "Predicting the next token",
    "Language models learn statistical patterns from text. A transformer predicts tokens from context. Fluent output does not guarantee factual accuracy; evaluation and source verification remain essential.",
    0,
  ],
  [
    "Vector Embeddings",
    "ai,search",
    "Coordinates for similarity",
    "Embeddings represent items as numerical vectors. Cosine similarity compares direction. Similarity can power retrieval, but the representation and training data determine what similar means.",
    0,
  ],
  [
    "React",
    "web,javascript",
    "Interfaces as a function of state",
    "React composes interfaces from components. State changes trigger rendering; effects synchronize with external systems. Keep derived values out of state when they can be calculated.",
    1,
  ],
  [
    "JavaScript",
    "web,javascript",
    "The language of interaction",
    "JavaScript uses an event loop to coordinate asynchronous work. Promises express future results. Closures preserve lexical scope, making callbacks and React hooks possible.",
    1,
  ],
  [
    "Node.js",
    "web,javascript",
    "JavaScript beyond the browser",
    "Node.js handles network and filesystem work with asynchronous I/O. CPU-heavy tasks still block the event loop. Small services should validate inputs and return predictable errors.",
    1,
  ],
  [
    "REST APIs",
    "web,architecture",
    "A shared language for services",
    "REST APIs organize resources behind URLs. HTTP methods express operations. Authentication, validation, status codes, and ownership checks form a reliable service boundary.",
    1,
  ],
  [
    "MongoDB",
    "web,data",
    "Documents with useful structure",
    "MongoDB stores BSON documents and supports indexes and aggregation. Model data around access patterns. Compound indexes work best when their leading fields match query constraints.",
    1,
  ],
  [
    "Graph Theory",
    "cs,graphs",
    "Think in nodes and relationships",
    "A graph contains vertices and edges. Degree counts incident edges. Connected components reveal isolated groups. Graphs model knowledge, social networks, dependencies, and routes.",
    2,
  ],
  [
    "Breadth-First Search",
    "cs,graphs,algorithms",
    "Explore one layer at a time",
    "BFS uses a queue and a visited set. It finds the shortest path in an unweighted graph. Mark nodes when enqueuing to avoid cycles and repeated work.\n\n```js\nconst queue = [start];\nconst visited = new Set([start]);\n```",
    2,
  ],
  [
    "Depth-First Search",
    "cs,graphs,algorithms",
    "Follow a thread to its end",
    "DFS explores deeply before backtracking. A stack or recursion tracks the current path. It is useful for connected components, cycle detection, and topological reasoning.",
    2,
  ],
  [
    "Algorithms",
    "cs,algorithms",
    "A repeatable way to solve a problem",
    "Algorithms transform inputs into outputs through finite steps. Correctness comes before optimization. Complexity describes how time and space grow with input size.",
    2,
  ],
  [
    "Systems Thinking",
    "cs,learning",
    "Relationships change the whole",
    "Systems thinking examines feedback loops and interactions. Local improvements can create global problems. Draw the relationships before optimizing an individual component.",
    2,
  ],
  [
    "Learning in Public",
    "learning,productivity",
    "Make understanding visible",
    "Explain what you learn in small, clear notes. Teaching reveals gaps in understanding. Feedback helps refine mental models, and linking new ideas makes future retrieval easier.",
    3,
  ],
  [
    "Spaced Repetition",
    "learning,memory",
    "Return just before you forget",
    "Spaced repetition schedules review over increasing intervals. Active recall strengthens memory more than passive rereading. Use specific questions and adapt intervals to retrieval difficulty.",
    3,
  ],
  [
    "Knowledge Management",
    "productivity,learning,graphs",
    "A home for connected thinking",
    "Capture useful ideas, connect related notes, and revisit what matters. A knowledge graph makes relationships visible. A small maintained system is more useful than an enormous unreviewed archive.",
    3,
  ],
  [
    "Deep Work",
    "productivity,learning",
    "Protect attention for difficult ideas",
    "Deep work reserves uninterrupted time for demanding tasks. Reduce context switching, define a clear outcome, and review what changed after each focused session.",
    3,
  ],
  [
    "A Walk Without a Destination",
    "reflection",
    "Leave room for an unexpected thought",
    "Take a quiet walk without a podcast or a plan. Notice light, texture, and small changes. This intentionally unconnected note leaves space for an idea that has not found its neighbors yet.",
    3,
  ],
];
const pairs = [
  [0, 1],
  [1, 2],
  [2, 3],
  [0, 4],
  [4, 3],
  [5, 6],
  [6, 7],
  [7, 8],
  [8, 9],
  [5, 8],
  [10, 11],
  [10, 12],
  [11, 13],
  [12, 13],
  [13, 14],
  [15, 16],
  [16, 17],
  [17, 18],
  [15, 18],
  [10, 17],
  [0, 16],
  [2, 10],
  [4, 9],
  [14, 17],
  [6, 13],
  [1, 14],
  [8, 10],
];
export async function seedDemo(owner) {
  const colors = ["#A78BFA", "#22D3EE", "#F472B6", "#FBBF77"];
  const notes = [];
  for (const [
    i,
    [title, tags, subtitle, content, cluster],
  ] of topics.entries()) {
    notes.push(
      await Note.findOneAndUpdate(
        { owner, demoKey: `neuron-v1-${i}` },
        {
          $setOnInsert: {
            owner,
            demoKey: `neuron-v1-${i}`,
            title,
            tags: tags.split(","),
            content: `> ${subtitle}\n\n${content}`,
            color: colors[cluster],
            isDemo: true,
          },
        },
        { upsert: true, returnDocument: "after" },
      ),
    );
  }
  for (const [i, [a, b]] of pairs.entries()) {
    const key = {
      owner,
      sourceNote: notes[a]._id,
      targetNote: notes[b]._id,
      relationType: ["relates_to", "supports", "extends"][i % 3],
    };
    await Link.updateOne(key, { $setOnInsert: key }, { upsert: true });
  }
  await record(owner, "Loaded Demo Brain", "demo", owner);
  return { notes: notes.length, links: pairs.length };
}
