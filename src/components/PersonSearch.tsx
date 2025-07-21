import React, { useState, useCallback } from 'react';
import { Select, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { tmdbApi, getImageUrl } from '../services/api';
import type { Person } from '../types';

interface PersonSearchProps {
  value?: { id: number; name: string };
  onChange?: (value: { id: number; name: string } | undefined) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}

export const PersonSearch: React.FC<PersonSearchProps> = ({
  value,
  onChange,
  placeholder = "Search actor/director...",
  style,
}) => {
  const [options, setOptions] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback(async (searchText: string) => {
    if (!searchText || searchText.length < 2) {
      setOptions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await tmdbApi.searchPeople(searchText);
      setOptions(response.results.slice(0, 10)); // Limit to top 10 results
    } catch (error) {
      console.error('Error searching people:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelect = (selectedValue: string) => {
    const selectedPerson = options.find(person => person.id.toString() === selectedValue);
    if (selectedPerson && onChange) {
      onChange({ id: selectedPerson.id, name: selectedPerson.name });
    }
  };

  const handleClear = () => {
    if (onChange) {
      onChange(undefined);
    }
    setOptions([]);
  };

  return (
    <Select
      showSearch
      value={value ? value.name : undefined}
      placeholder={placeholder}
      style={style}
      filterOption={false}
      onSearch={handleSearch}
      onSelect={handleSelect}
      onClear={handleClear}
      loading={loading}
      allowClear
      notFoundContent={loading ? 'Searching...' : 'No results found'}
    >
      {options.map(person => (
        <Select.Option key={person.id} value={person.id.toString()}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar
              size={24}
              src={getImageUrl(person.profile_path, 'w200')}
              icon={<UserOutlined />}
            />
            <span>{person.name}</span>
            {person.known_for_department && (
              <span style={{ color: '#666', fontSize: '12px' }}>
                ({person.known_for_department})
              </span>
            )}
          </div>
        </Select.Option>
      ))}
    </Select>
  );
};
