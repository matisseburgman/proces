import { useEffect, useState } from 'react';
import { supabase } from "@/lib/supabaseClient";

import Tag from "@/components/ui/tag";


function TagsList() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTags() {
      const { data, error } = await supabase
        .from('priorities')
        .select('*')
        .order('level', { ascending: false });

      if (error) {
        console.error('Error fetching tags:', error);
      } else {
        setTags(data);
      }
      setLoading(false);
    }

    fetchTags();
  }, []);

  if (loading) return <div>Loading tags...</div>;

  return (
    <div>
        <h1 className="text-3xl font-bold text-left mb-3">My tags</h1>
        <div className="flex gap-2.5 flex-wrap mb-6">
            {tags.map((tag) => (
            <Tag key={tag.id} name={tag.name} color={tag.color} />
            ))}
        </div>
        </div>
  );
}

export default TagsList;