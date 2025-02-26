import { db } from "../db";
import { sql } from "drizzle-orm";

export async function assignReportClusterIds(minPoints = 2, distance = 10000) {
  try {
    await db.execute(sql`
      UPDATE reports
      SET cluster_id = COALESCE(subquery.cluster_id, '-1')
      FROM (
        SELECT
          id,
          ST_ClusterDBSCAN(ST_Transform(location, 3857), ${distance}, ${minPoints}) OVER () AS cluster_id
        FROM reports
      ) AS subquery
      WHERE reports.id = subquery.id;
    `);
    console.log("Cluster IDs assigned successfully.");
  } catch (error) {
    console.error("Error assigning cluster IDs:", error);
  }
}

// export async function updateReportClusters(minPoints = 2, distance = 10000) {
//   try {
//     // Step 1: Clear the clusters table
//     await db.execute(sql`TRUNCATE TABLE report_clusters RESTART IDENTITY;`);

//     // Step 2: Insert updated cluster data
//     await db.execute(sql`
//       INSERT INTO report_clusters (cluster_id, polygon, centroid, markers)
//       WITH cluster_polygons AS (
//         SELECT
//           cluster_id::TEXT,
//           ST_AsGeoJSON(ST_ConvexHull(ST_Collect(location)))::jsonb AS polygon,  -- Cast to jsonb
//           ST_AsGeoJSON(ST_Centroid(ST_ConvexHull(ST_Collect(location))))::jsonb AS centroid  -- Cast to jsonb
//         FROM reports
//         WHERE cluster_id IS NOT NULL
//         GROUP BY cluster_id
//       )
//       SELECT
//         r.cluster_id::TEXT,
//         cp.polygon,
//         cp.centroid,
//         json_agg(
//           json_build_object(
//             'id', r.id,
//             'name', r.name,
//             'address', r.address,
//             'longitude', ST_X(r.location),
//             'latitude', ST_Y(r.location)
//           )
//         )::jsonb AS markers  -- Ensure markers are jsonb
//       FROM reports r
//       LEFT JOIN cluster_polygons cp ON r.cluster_id = cp.cluster_id::TEXT
//       GROUP BY r.cluster_id, cp.polygon, cp.centroid
//       ORDER BY r.cluster_id;
//     `);

//     console.log("Report clusters updated successfully.");
//   } catch (error) {
//     console.error("Error updating report clusters:", error);
//   }
// }

// export async function updateReportClusters(minPoints = 2, distance = 10000) {
//   try {
//     // Step 1: Clear the clusters table
//     await db.execute(sql`TRUNCATE TABLE report_clusters RESTART IDENTITY;`);

//     // Step 2: Insert updated cluster data
//     await db.execute(sql`
//       INSERT INTO report_clusters (cluster_id, polygon, centroid, markers)
//       WITH cluster_polygons AS (
//         SELECT
//           cluster_id::TEXT,
//           ST_AsGeoJSON(ST_ConvexHull(ST_Collect(location)))::jsonb AS polygon,  -- Cast to jsonb
//           ST_AsGeoJSON(ST_Centroid(ST_ConvexHull(ST_Collect(location))))::jsonb AS centroid  -- Cast to jsonb
//         FROM reports
//         WHERE cluster_id IS NOT NULL
//         GROUP BY cluster_id
//       )
//       SELECT
//         r.cluster_id::TEXT,
//         cp.polygon,
//         cp.centroid,
//         json_agg(
//           json_build_object(
//             'id', r.id,
//             'name', r.name,
//             'address', r.address,
//             'longitude', ST_X(r.location),
//             'latitude', ST_Y(r.location),
//             'user', json_build_object(
//               'id', u.id,
//               'username', u.username,
//               'email', u.email
//             ),
//             'images', (
//               SELECT json_agg(
//                 json_build_object(
//                   'id', ri.id,
//                   'imageUrl', ri.imageUrl,
//                   'name', ri.name,
//                   'hasFace', ri.hasFace
//                 )
//               ) FROM reportImages ri WHERE ri.report_id = r.id
//             )
//           )
//         )::jsonb AS markers  -- Ensure markers are jsonb
//       FROM reports r
//       LEFT JOIN cluster_polygons cp ON r.cluster_id = cp.cluster_id::TEXT
//       LEFT JOIN users u ON r.user_id = u.id  -- Join with users table
//       GROUP BY r.cluster_id, cp.polygon, cp.centroid
//       ORDER BY r.cluster_id;
//     `);

//     console.log("Report clusters updated successfully.");
//   } catch (error) {
//     console.error("Error updating report clusters:", error);
//   }
// }

export async function updateReportClusters(minPoints = 2, distance = 10000) {
  try {
    // Step 1: Clear the clusters table
    await db.execute(sql`TRUNCATE TABLE report_clusters RESTART IDENTITY;`);

    // Step 2: Insert updated cluster data
    await db.execute(sql`
      INSERT INTO report_clusters (cluster_id, polygon, centroid, markers)
      WITH cluster_polygons AS (
        SELECT
          cluster_id::TEXT,
          ST_AsGeoJSON(ST_ConvexHull(ST_Collect(location)))::jsonb AS polygon,  -- Cast to jsonb
          ST_AsGeoJSON(ST_Centroid(ST_ConvexHull(ST_Collect(location))))::jsonb AS centroid  -- Cast to jsonb
        FROM reports
        WHERE cluster_id IS NOT NULL
        GROUP BY cluster_id
      )
      SELECT
        r.cluster_id::TEXT,
        cp.polygon,
        cp.centroid,
        json_agg(
          json_build_object(
            'id', r.id,
            'name', r.name,
            'address', r.address,
            'longitude', ST_X(r.location),
            'latitude', ST_Y(r.location),
            'user', json_build_object(
              'id', u.id,
              'username', u.username,
              'email', u.email
            ),
            'images', (
              SELECT json_agg(
                json_build_object(
                  'id', ri.id,
                  'imageUrl', ri.image_url,
                  'name', ri.name,
                  'hasFace', ri.has_face
                )
              ) FROM report_images ri WHERE ri.report_id = r.id  -- ✅ Fixed table name
            )
          )
        )::jsonb AS markers  -- Ensure markers are jsonb
      FROM reports r
      LEFT JOIN cluster_polygons cp ON r.cluster_id = cp.cluster_id::TEXT
      LEFT JOIN users u ON r.user_id = u.id  -- Join with users table
      GROUP BY r.cluster_id, cp.polygon, cp.centroid
      ORDER BY r.cluster_id;
    `);

    console.log("Report clusters updated successfully.");
  } catch (error) {
    console.error("Error updating report clusters:", error);
  }
}
